import type { FlashCard } from "@/converters/types";
import {
  type SplitSettings,
  PREDEFINED_EXTRACTION_SETS,
  DEFAULT_SPLIT_SETTINGS,
  extractFlashcardsFromText,
} from "@/components/flashcard/SplitSettingsDialog";
import type { ExtractorOptions, ExtractorResult, ExtractorStrategy, DiagnosticIssue } from "../types";

export class RegexExtractor implements ExtractorStrategy {
  readonly id = "regex";
  readonly label = "Delimited Markdown / Q&A";

  canExtract(text: string): boolean {
    return text.trim().length > 0;
  }

  extract(text: string, options: ExtractorOptions): ExtractorResult {
    const diagnostics: DiagnosticIssue[] = [];
    const activeSettings = options.splitSettings || DEFAULT_SPLIT_SETTINGS;

    // Prioritize activeSettings (user's explicit selection) first
    let bestExtracted: FlashCard[] = [];
    let bestSettings: SplitSettings = activeSettings;

    try {
      bestExtracted = extractFlashcardsFromText(text, activeSettings);
    } catch {
      // Ignore regex failure in activeSettings
    }

    // Only if activeSettings matched 0 cards, test other predefined candidates as fallback
    if (bestExtracted.length === 0) {
      for (const candidate of PREDEFINED_EXTRACTION_SETS) {
        if (candidate.id === activeSettings.id) continue;
        try {
          const extracted = extractFlashcardsFromText(text, candidate);
          if (extracted.length > bestExtracted.length) {
            bestExtracted = extracted;
            bestSettings = candidate;
          }
        } catch {
          // Ignore regex failure in candidate
        }
      }
    }

    if (bestExtracted.length === 0) {
      diagnostics.push({
        id: "regex-no-match",
        level: "warning",
        message: "No flashcards found. Try standard '### Question' and '### Answer' headings or adjust separators in Parser Tuning.",
      });
      return {
        cards: [],
        matchedStrategy: this.id,
        diagnostics,
        usedSettings: activeSettings,
      };
    }

    // Perform quality checks on extracted cards
    bestExtracted.forEach((card, index) => {
      const front = card.front.trim();
      const back = card.back.trim();

      if (!front) {
        diagnostics.push({
          id: `card-${index}-empty-front`,
          level: "warning",
          message: `Card #${index + 1} has an empty question (front).`,
          cardIndex: index,
        });
      }
      if (!back) {
        diagnostics.push({
          id: `card-${index}-empty-back`,
          level: "warning",
          message: `Card #${index + 1} has an empty answer (back).`,
          cardIndex: index,
        });
      }

      // Check for unclosed KaTeX math delimiters ($ or $$)
      const singleDollarCount = (front.match(/(?<!\\)\$/g) || []).length;
      if (singleDollarCount % 2 !== 0) {
        diagnostics.push({
          id: `card-${index}-unclosed-latex`,
          level: "info",
          message: `Card #${index + 1} may have an unclosed LaTeX math '$' delimiter.`,
          cardIndex: index,
        });
      }
    });

    return {
      cards: bestExtracted,
      matchedStrategy: this.id,
      diagnostics,
      usedSettings: bestSettings,
    };
  }
}
