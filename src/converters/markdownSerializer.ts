import type { FlashCard } from "./types";

export interface MarkdownSerializeOptions {
  /**
   * Title used for the card question header (default: "Front")
   */
  frontHeader?: string;
  /**
   * Title used for the card answer header (default: "Back")
   */
  backHeader?: string;
  /**
   * Card boundary separator marker (default: "---")
   */
  separator?: string;
  /**
   * Whether to prefix cards with card index headers (e.g. # Card 1) (default: true)
   */
  includeCardHeaders?: boolean;
}

/**
 * Serializes a list of FlashCards into canonical, standard Markdown.
 *
 * Emits hierarchical sections (# Card N / ## Front / ## Back / ## CustomField)
 * separated by thematic breaks (---), providing an idempotent, lossless
 * representation for storage, sharing, and round-trip verification.
 */
export function cardsToMarkdown(
  cards: FlashCard[],
  options: MarkdownSerializeOptions = {}
): string {
  if (!cards || cards.length === 0) {
    return "";
  }

  const {
    frontHeader = "Front",
    backHeader = "Back",
    separator = "---",
    includeCardHeaders = true,
  } = options;

  const cardBlocks = cards.map((card, index) => {
    const sections: string[] = [];

    if (includeCardHeaders) {
      sections.push(`# Card ${index + 1}`);
    }

    // 1. Question (Front)
    sections.push(`## ${frontHeader}\n\n${card.front.trim()}`);

    // 2. Answer (Back)
    sections.push(`## ${backHeader}\n\n${card.back.trim()}`);

    // 3. Custom Fields (Notes, Sources, Citations, etc.)
    if (card.customFields) {
      const entries = Object.entries(card.customFields);
      for (const [key, val] of entries) {
        const trimmedVal = typeof val === "string" ? val.trim() : "";
        if (trimmedVal) {
          sections.push(`## ${key.trim()}\n\n${trimmedVal}`);
        }
      }
    }

    return sections.join("\n\n");
  });

  return cardBlocks.join(`\n\n${separator}\n\n`) + "\n";
}
