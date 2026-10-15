/**
 * Normalizes math syntax across various formats (Anki-MathJax tags,
 * LaTeX \(...\) inline and \[...\] display math) to standard remark-math ($...$ and $$...$$).
 */
export function normalizeMathMarkdown(raw: string): string {
  if (!raw) return "";
  let s = raw;
  // Anki native tags
  s = s.replace(/\\?<anki-mathjax[^>]*?block=["']?1["']?[^>]*>([\s\S]*?)\\?<\/anki-mathjax>/gi, (_, math) => `\n\n$$${math}$$\n\n`);
  s = s.replace(/\\?<anki-mathjax[^>]*>([\s\S]*?)\\?<\/anki-mathjax>/gi, (_, math) => `$${math}$`);
  // LaTeX display math \[...\] and double escaped \\[...\\]
  s = s.replace(/\\\\?\[([\s\S]*?)\\\\?\]/g, (_, math) => `\n\n$$${math}$$\n\n`);
  // LaTeX inline math \(...\) and double escaped \\(...\\)
  s = s.replace(/\\\\?\(([\s\S]*?)\\\\?\)/g, (_, math) => `$${math}$`);
  return s;
}
