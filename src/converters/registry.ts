import type { Converter, ConversionResult, DownloadFormat, FlashCard } from "./types";
import { ankiTsvConverter } from "./ankiTsv";
import { apkgConverter } from "./apkg";

// ---------------------------------------------------------------------------
// Registry – add new converters here; detection is first-match wins.
// ---------------------------------------------------------------------------
const CONVERTERS: readonly Converter[] = [ankiTsvConverter, apkgConverter];

// ---------------------------------------------------------------------------
// Auto-detection
// ---------------------------------------------------------------------------

function extensionOf(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

/**
 * Returns the first registered converter that claims the file extension, or
 * `null` when no converter matches.
 */
export function detectConverter(fileName: string): Converter | null {
  const ext = extensionOf(fileName);
  return CONVERTERS.find((c) => c.supportedExtensions.includes(ext)) ?? null;
}

/** Lists all extensions that have a registered converter. */
export function acceptedExtensions(): string[] {
  return CONVERTERS.flatMap((c) => c.supportedExtensions.map((e) => `.${e}`));
}

// ---------------------------------------------------------------------------
// Output serialisers
// ---------------------------------------------------------------------------

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function cardsToCSV(cards: FlashCard[]): string {
  const header = "front,back";
  const rows = cards.map(
    ({ front, back }) => `${csvEscape(front)},${csvEscape(back)}`,
  );
  return [header, ...rows].join("\n") + "\n";
}

export function cardsToJSON(cards: FlashCard[], style?: string): string {
  if (style) {
    return JSON.stringify({ style, cards }, null, 2);
  }
  return JSON.stringify(cards, null, 2);
}

export function serialise(cards: FlashCard[], format: DownloadFormat, style?: string): string {
  return format === "csv" ? cardsToCSV(cards) : cardsToJSON(cards, style);
}

export function mimeTypeOf(format: DownloadFormat): string {
  return format === "csv" ? "text/csv" : "application/json";
}

export function fileExtensionOf(format: DownloadFormat): string {
  return format === "csv" ? "csv" : "json";
}

// Re-export types so consumers can import everything from one place.
export type { Converter, ConversionResult, DownloadFormat, FlashCard };
