import type { ContentTransformer, TransformationContext } from "../types";

export class FieldLabelTransformer implements ContentTransformer {
  readonly id = "field-labels";
  readonly name = "Field Label Cleaner";
  readonly description = "Strips redundant bold field labels baked into card text (e.g. **Front:**, **Vorderseite:**).";
  readonly order = 10;

  private static readonly LABEL_REGEX =
    /^\s*\*\*?(Vorderseite|Rückseite|Antwort|Front|Back|Question|Frage|Answer)\*\*?:\s*/gim;

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
