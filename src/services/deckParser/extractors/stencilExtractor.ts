import type { FlashCard } from "@/converters/types";
import { applyStencilToMarkdown } from "@/lib/extraction";
import type { ExtractorOptions, ExtractorResult, ExtractorStrategy, DiagnosticIssue } from "../types";

export class StencilExtractor implements ExtractorStrategy {
  readonly id = "stencil";
  readonly label = "AI Structure Heuristic";

  canExtract(text: string): boolean {
    return text.trim().length > 0;
  }

  extract(text: string, options: ExtractorOptions): ExtractorResult {
    const diagnostics: DiagnosticIssue[] = [];
    const stencil = options.aiStencil;
    if (!stencil) {
      return { cards: [], matchedStrategy: this.id, diagnostics };
    }

    const cards: FlashCard[] = [];
    const chunks = text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);

    let index = 0;
    for (const chunk of chunks) {
      index++;
      try {
        const c = applyStencilToMarkdown(chunk, stencil);
        if (c.front && c.back) {
          cards.push({
            front: c.front,
            back: c.back,
            id: `card-${index}`,
          });
        }
      } catch {
        // malformed chunk skipped
      }
    }

    if (cards.length === 0) {
      diagnostics.push({
        id: "stencil-no-matches",
        level: "warning",
        message: "No cards matched the current AI Structure Stencil.",
      });
    }

    return {
      cards,
      matchedStrategy: this.id,
      diagnostics,
    };
  }
}
