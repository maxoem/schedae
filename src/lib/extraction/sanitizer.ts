// Small deterministic sanitizers applied to extracted strings
export function sanitizeExtractedString(s: string): string {
  if (!s) return "";
  let out = s;
  // Remove common bolded labels anywhere (e.g. **Vorderseite:**, **Antwort:**)
  out = out.replace(/\*\*?(Vorderseite|Rückseite|Antwort|Front|Back|Question|Frage|Answer)\*\*?:\s*/gi, "");
  // Remove bracketed metadata like [Tag | Meta] anywhere
  out = out.replace(/\[[^\]]+\]\s*/g, "");
  // Remove simple prefixed markers like "Front:" or "Antwort:" anywhere
  out = out.replace(/\b(Vorderseite|Rückseite|Antwort|Front|Back|Question|Frage|Answer)\b:\s*/gi, "");
  // Collapse multiple whitespace/newlines to single spaces and trim
  out = out.replace(/[\t\r]+/g, " ").replace(/\n{2,}/g, "\n").replace(/\s{2,}/g, " ");
  return out.trim();
}

// A milder sanitizer that keeps markdown/newlines intact but removes common labels/metadata.
export function sanitizeExtractedMarkdown(s: string): string {
  if (!s) return "";
  let out = s;
  out = out.replace(/\*\*?(Vorderseite|Rückseite|Antwort|Front|Back|Question|Frage|Answer)\*\*?:\s*/gi, "");
  out = out.replace(/\[[^\]]+\]\s*/g, "");
  out = out.replace(/\b(Vorderseite|Rückseite|Antwort|Front|Back|Question|Frage|Answer)\b:\s*/gi, "");
  return out.trim();
}
