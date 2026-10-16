import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Dedents a multiline string by removing the common leading whitespace
 * from all non-empty lines, preserving relative sub-indentations.
 */
export function dedentText(text: string): string {
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
  if (nonEmptyLines.length === 0) return "";

  // Determine minimum indentation across non-empty lines
  let minIndent = Infinity;
  for (const line of nonEmptyLines) {
    const match = line.match(/^[ \t]*/);
    const indent = match ? match[0].length : 0;
    if (indent < minIndent) {
      minIndent = indent;
    }
  }

  if (minIndent === 0 || minIndent === Infinity) {
    return text.trim();
  }

  return lines
    .map((line) => {
      if (line.trim().length === 0) return "";
      return line.length >= minIndent ? line.slice(minIndent) : line.trimStart();
    })
    .join("\n")
    .trim();
}
