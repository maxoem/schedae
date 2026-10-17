import type { ContentTransformer, TransformationContext } from "../types";

export class WhitespaceTransformer implements ContentTransformer {
  readonly id = "whitespace";
  readonly name = "Whitespace Normalizer";
  readonly description = "Normalizes line endings, strips trailing whitespace, collapses excessive blank lines, and trims outer space.";
  readonly order = 50;

  private static readonly TRAILING_SPACE_REGEX = /[ \t]+$/m;
  private static readonly MULTI_NEWLINE_REGEX = /\n{3,}/;

  canTransform(content: string, _context?: TransformationContext): boolean {
    if (!content || typeof content !== "string") return false;
    return (
      content.includes("\r") ||
      WhitespaceTransformer.TRAILING_SPACE_REGEX.test(content) ||
      WhitespaceTransformer.MULTI_NEWLINE_REGEX.test(content) ||
      content !== content.trim()
    );
  }

  transform(content: string, _context?: TransformationContext): string {
    if (!content) return "";
    let s = content;

    // 1. Normalize line endings to standard Unix \n
    s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // 2. Strip trailing spaces from each line
    s = s.replace(/[ \t]+$/gm, "");

    // 3. Collapse 3+ newlines to standard double newlines
    s = s.replace(/\n{3,}/g, "\n\n");

    return s.trim();
  }
}
