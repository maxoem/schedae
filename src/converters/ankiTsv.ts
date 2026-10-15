import type { Converter, ConversionResult, FlashCard } from "./types";

/**
 * Parses an Anki-style TSV export (tab-separated, RFC-4180 quoting, ""→").
 * Comment / metadata lines starting with # are ignored.
 * Quoted fields may span multiple lines.
 */
function parseAnkiTSV(text: string): string[][] {
  const records: string[][] = [];
  let i = 0;
  const n = text.length;

  while (i < n) {
    // Skip metadata / comment lines
    if (text[i] === "#") {
      while (i < n && text[i] !== "\n") i++;
      if (i < n) i++;
      continue;
    }

    // Skip bare newlines (empty lines)
    if (text[i] === "\r") {
      i++;
      if (i < n && text[i] === "\n") i++;
      continue;
    }
    if (text[i] === "\n") {
      i++;
      continue;
    }

    const record: string[] = [];
    let endOfRecord = false;

    while (!endOfRecord && i < n) {
      if (text[i] === '"') {
        i++; // skip opening quote
        let field = "";
        while (i < n) {
          if (text[i] === '"') {
            if (i + 1 < n && text[i + 1] === '"') {
              field += '"';
              i += 2;
            } else {
              i++;
              break;
            }
          } else {
            field += text[i++];
          }
        }
        record.push(field);
        if (i < n && text[i] === "\t") {
          i++;
        } else {
          if (i < n && text[i] === "\r") i++;
          if (i < n && text[i] === "\n") i++;
          endOfRecord = true;
        }
      } else {
        let field = "";
        while (
          i < n &&
          text[i] !== "\t" &&
          text[i] !== "\n" &&
          text[i] !== "\r"
        ) {
          field += text[i++];
        }
        record.push(field);
        if (i < n && text[i] === "\t") {
          i++;
        } else {
          if (i < n && text[i] === "\r") i++;
          if (i < n && text[i] === "\n") i++;
          endOfRecord = true;
        }
      }
    }

    if (record.length >= 2) records.push(record);
  }

  return records;
}

/**
 * Uses DOMParser to extract the text content of `<div id="<id>">` after
 * stripping all <script> and <style> nodes.
 */
function extractDivContent(html: string, id: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  doc.querySelectorAll("script, style").forEach((el) => el.remove());
  const div = doc.getElementById(id);
  return div ? div.innerHTML.trim() : "";
}

/**
 * Converts raw Anki HTML innerHTML to clean markdown-compatible text.
 * LaTeX delimiters ($…$, $$…$$) and markdown syntax (**, *, etc.) are
 * passed through verbatim.
 */
function htmlToMarkdown(innerHTML: string): string {
  let str = innerHTML;
  str = str.replace(/<[/]?pre[^>]*>/gi, "");
  str = str.replace(/<br\s*[/]?[^>]*>[ \t]*(?=[*+-]|\d+\.)/gi, "\n");
  str = str.replace(/<br\s*[/]?[^>]*>/gi, "\n");
  str = str.replace(/<div[^>]*>/gi, "\n");
  str = str.replace(/<\/div[^>]*>/gi, "");
  str = str.replace(/<[/]?span[^>]*>/gi, "");
  str = str.replace(/<[^>]+>/g, "");
  str = str.replace(/&nbsp;/gi, " ");
  str = str.replace(/&tab;/gi, "\t");
  str = str.replace(/&gt;/gi, ">");
  str = str.replace(/&lt;/gi, "<");
  str = str.replace(/&amp;/gi, "&");
  str = str.replace(/(^|\n) ([*+-]|\d+\.) /g, "$1$2 ");
  str = str.replace(/\n{3,}/g, "\n\n");
  return str.trim();
}

export const ankiTsvConverter: Converter = {
  name: "Anki TSV / CSV Export",
  supportedExtensions: ["txt", "tsv", "csv"],

  async convert(content): Promise<ConversionResult> {
    if (typeof content !== "string") {
      throw new TypeError("Anki TSV converter expects a string input.");
    }

    const records = parseAnkiTSV(content);

    if (records.length === 0) {
      throw new Error(
        "No cards found. Expected an Anki TSV export with <div id=\"front\"> and <div id=\"back\"> fields.",
      );
    }

    const cards: FlashCard[] = [];

    for (const record of records) {
      const frontHtml = extractDivContent(record[0], "front");
      const backHtml = extractDivContent(record[1], "back");

      if (!frontHtml && !backHtml) continue;

      cards.push({
        front: htmlToMarkdown(frontHtml),
        back: htmlToMarkdown(backHtml),
      });
    }

    return { cards, sourceFormat: "anki-tsv" };
  },
};
