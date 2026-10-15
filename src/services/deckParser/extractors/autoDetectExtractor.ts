import type { ExtractorOptions, ExtractorResult, ExtractorStrategy } from "../types";
import { FormatDetector } from "../heuristics/formatDetector";
import { JsonExtractor } from "./jsonExtractor";
import { MarkdownSectionsExtractor } from "./markdownSectionsExtractor";
import { KeyValueExtractor } from "./keyValueExtractor";
import { StencilExtractor } from "./stencilExtractor";
import { RegexExtractor } from "./regexExtractor";

/**
 * AutoDetectExtractor implements ExtractorStrategy to heuristically inspect
 * input text (especially Card 1) and dispatch extraction to the optimal specialized extractor.
 */
export class AutoDetectExtractor implements ExtractorStrategy {
  public readonly id = "auto";
  public readonly label = "✨ Auto-Detect Format";

  private jsonExtractor: JsonExtractor;
  private markdownSectionsExtractor: MarkdownSectionsExtractor;
  private keyValueExtractor: KeyValueExtractor;
  private stencilExtractor: StencilExtractor;
  private regexExtractor: RegexExtractor;

  constructor(options?: {
    jsonExtractor?: JsonExtractor;
    markdownSectionsExtractor?: MarkdownSectionsExtractor;
    keyValueExtractor?: KeyValueExtractor;
    stencilExtractor?: StencilExtractor;
    regexExtractor?: RegexExtractor;
  }) {
    this.jsonExtractor = options?.jsonExtractor ?? new JsonExtractor();
    this.markdownSectionsExtractor = options?.markdownSectionsExtractor ?? new MarkdownSectionsExtractor();
    this.keyValueExtractor = options?.keyValueExtractor ?? new KeyValueExtractor();
    this.stencilExtractor = options?.stencilExtractor ?? new StencilExtractor();
    this.regexExtractor = options?.regexExtractor ?? new RegexExtractor();
  }

  /**
   * AutoDetect can handle any non-empty input.
   */
  public canExtract(text: string): boolean {
    return text.trim().length > 0;
  }

  /**
   * Runs the format heuristic detector and invokes the matching extractor.
   */
  public extract(text: string, options: ExtractorOptions = {}): ExtractorResult {
    // 1. Check if input is JSON
    if (this.jsonExtractor.canExtract(text)) {
      const res = this.jsonExtractor.extract(text, options);
      if (res.cards.length > 0) return res;
    }

    // 2. Check if AI Stencil heuristic is explicitly requested
    if (options.parserMode === "heuristic" && options.aiStencil) {
      const res = this.stencilExtractor.extract(text, options);
      if (res.cards.length > 0) return res;
    }

    // 3. Inspect structure with FormatDetector
    const heuristic = FormatDetector.detect(text);

    // 4. Try Hierarchical Markdown Headings & Multi-Section Cards
    if (this.markdownSectionsExtractor.canExtract(text)) {
      const res = this.markdownSectionsExtractor.extract(text, options);
      if (res.cards.length > 0) return res;
    }

    // 5. Try Bullet Lists & Key-Value cards
    if (this.keyValueExtractor.canExtract(text)) {
      const res = this.keyValueExtractor.extract(text, options);
      if (res.cards.length > 0) return res;
    }

    // 6. Fallback to Regex / delimiter extractor
    const regexRes = this.regexExtractor.extract(text, options);
    if (regexRes.cards.length > 0) {
      return regexRes;
    }

    // 7. No cards extracted
    return {
      cards: [],
      matchedStrategy: "auto",
      diagnostics: [
        {
          id: "no-cards-detected",
          level: "info",
          message: `Auto-detection completed (pattern: ${heuristic.patternId}), but no valid flashcards could be parsed.`,
        },
      ],
    };
  }
}
