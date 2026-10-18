import type { ContentTransformer, TransformationContext } from "../types";

export class FieldLabelTransformer implements ContentTransformer {
  readonly id = "field-labels";
  readonly name = "Field Label Cleaner";
  readonly description = "Strips redundant bold, italic, or plain field labels baked into card text (e.g. **Front:**, **Vorderseite:**, Note:, **Quelle:**).";
  readonly order = 10;

  private static readonly LABEL_REGEX =
    /^\s*(?:\*{1,2}|_{1,2})?(Vorderseite|Rückseite|Antwort|Front|Back|Question|Frage|Answer|Note|Hinweis|Quelle|Quellen|Source|Sources)(?::(?:\*{1,2}|_{1,2})|(?:\*{1,2}|_{1,2})?\s*:)\s*/gim;

  canTransform(content: string, _context?: TransformationContext): boolean {
    if (!content || typeof content !== "string") return false;
    FieldLabelTransformer.LABEL_REGEX.lastIndex = 0;
    return FieldLabelTransformer.LABEL_REGEX.test(content);
  }

  transform(content: string, _context?: TransformationContext): string {
    if (!content) return "";
    FieldLabelTransformer.LABEL_REGEX.lastIndex = 0;
    return content.replace(FieldLabelTransformer.LABEL_REGEX, "");
  }
}
