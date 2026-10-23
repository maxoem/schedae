export interface FlashCard {
  front: string;
  back: string;
  customFields?: Record<string, string>;
  id?: string | number;
  tags?: string;
  guid?: string;
  mid?: number;
  mod?: number;
  usn?: number;
  deckId?: string | number;
  deckName?: string;
  cards?: Array<{
    id?: number;
    ord?: number;
    did?: number;
    scheduling?: {
      type: number;
      queue: number;
      due: number;
      ivl: number;
      factor: number;
      reps: number;
      lapses: number;
      left: number;
      odue: number;
      odid: number;
      flags: number;
      mod: number;
      usn: number;
    };
  }>;
}

export interface ConversionResult {
  cards: FlashCard[];
  sourceFormat: string;
  /** Per-deck CSS extracted from the source (e.g. Anki notetype styles). */
  style?: string;
}

export interface Converter {
  readonly name: string;
  readonly supportedExtensions: readonly string[];
  /**
   * When `true`, the file will be read as an `ArrayBuffer` before being
   * passed to `convert`. When `false` (default), it is read as a UTF-8
   * string.
   */
  readonly binary?: boolean;
  /**
   * Converts raw file content into a normalised list of flash cards.
   * `content` is a string for text-based formats and an ArrayBuffer for
   * binary formats (e.g. .apkg).
   */
  convert(
    content: string | ArrayBuffer,
    fileName: string,
  ): Promise<ConversionResult>;
}

export type DownloadFormat = "csv" | "json" | "markdown" | "md";
