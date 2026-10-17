import { MathEnvironmentTransformer } from "@/services/deckTransformer/transformers/mathEnvironmentTransformer";

const mathTransformer = new MathEnvironmentTransformer();

/**
 * Normalizes math syntax across various formats (Anki-MathJax tags,
 * LaTeX \(...\) inline and \[...\] display math, bare display environments) to standard remark-math ($...$ and $$...$$).
 * If the content does not contain math syntax requiring normalization, it is returned untouched.
 */
export function normalizeMathMarkdown(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  if (mathTransformer.canTransform(raw)) {
    return mathTransformer.transform(raw);
  }
  return raw;
}
