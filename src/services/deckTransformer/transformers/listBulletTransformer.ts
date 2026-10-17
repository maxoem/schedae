import type { ContentTransformer, TransformationContext } from "../types";

export class ListBulletTransformer implements ContentTransformer {
  readonly id = "list-bullets";
  readonly name = "List Bullet & Indentation Formatter";
  readonly description = "Cleans stray <br> tags adjacent to lists and trims accidental single-space indentations while strictly preserving intentional sub-bullets.";
  readonly order = 40;

  private static readonly BR_TAG_REGEX = /<br\s*[\/]?[^>]*>/i;
  private static readonly SINGLE_SPACE_BULLET_REGEX = /(^|\n) ([*+-]|\d+\.) /;

  canTransform(content: string, _context?: TransformationContext): boolean {
    if (!content || typeof content !== "string") return false;
    return (
      ListBulletTransformer.BR_TAG_REGEX.test(content) ||
      ListBulletTransformer.SINGLE_SPACE_BULLET_REGEX.test(content)
    );
  }

  transform(content: string, _context?: TransformationContext): string {
    if (!content) return "";
    let s = content;

    // 1. Strip raw <br> tags to standard newlines
    s = s.replace(/<br\s*[\/]?[^>]*>/gi, "\n");

    // 2. Strip accidental single-space indentations before list markers (leaves 2+ spaces / tabs intact)
    s = s.replace(/(^|\n) ([*+-]|\d+\.) /g, "$1$2 ");

    return s;
  }
}
