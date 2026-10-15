import type { FlashCard } from "@/converters/types";
import type { ExtractorOptions, ExtractorResult, ExtractorStrategy, DiagnosticIssue } from "../types";

export class JsonExtractor implements ExtractorStrategy {
  readonly id = "json";
  readonly label = "JSON Format";

  canExtract(text: string): boolean {
    const trimmed = text.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) return true;
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) return true;
    if (/```(?:json)?\s*[{[][\s\S]*?[}\]]\s*```/i.test(trimmed)) return true;
    return false;
  }

  extract(text: string, options: ExtractorOptions): ExtractorResult {
    let cleanText = text.trim();
    const diagnostics: DiagnosticIssue[] = [];

    // Strip markdown code fences if wrapped in ```json ... ```
    const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      cleanText = codeBlockMatch[1].trim();
    }

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(cleanText);
    } catch {
      // Try finding the array boundary
      const start = cleanText.indexOf("[");
      const end = cleanText.lastIndexOf("]");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(cleanText.substring(start, end + 1));
        } catch {
          diagnostics.push({
            id: "json-syntax-error",
            level: "error",
            message: "Malformed JSON syntax. Please check for missing commas or unescaped quotes.",
          });
          return { cards: [], matchedStrategy: this.id, diagnostics };
        }
      } else {
        diagnostics.push({
          id: "json-syntax-error",
          level: "error",
          message: "Unable to parse text as valid JSON.",
        });
        return { cards: [], matchedStrategy: this.id, diagnostics };
      }
    }

    let rawCards: Record<string, unknown>[] = [];
    let deckTitle: string | undefined;
    let deckStyle: string | undefined;

    if (Array.isArray(parsed)) {
      rawCards = parsed as Record<string, unknown>[];
    } else if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj.cards)) {
        rawCards = obj.cards as Record<string, unknown>[];
      }
      if (typeof obj.title === "string") deckTitle = obj.title;
      else if (typeof obj.name === "string") deckTitle = obj.name;
      if (typeof obj.style === "string") deckStyle = obj.style;
    }

    const cards: FlashCard[] = [];
    rawCards.forEach((raw, index) => {
      if (!raw || typeof raw !== "object") return;

      const front = String(raw.front ?? raw.question ?? raw.Front ?? raw.Question ?? "").trim();
      const back = String(raw.back ?? raw.answer ?? raw.Back ?? raw.Answer ?? "").trim();

      if (!front && !back) {
        diagnostics.push({
          id: `card-${index}-empty`,
          level: "warning",
          message: `Card #${index + 1} has empty front and back fields.`,
          cardIndex: index,
        });
        return;
      }

      if (!front) {
        diagnostics.push({
          id: `card-${index}-no-front`,
          level: "warning",
          message: `Card #${index + 1} has an empty front field.`,
          cardIndex: index,
        });
      }

      if (!back) {
        diagnostics.push({
          id: `card-${index}-no-back`,
          level: "warning",
          message: `Card #${index + 1} has an empty back field.`,
          cardIndex: index,
        });
      }

      if (options.strictJson && (!front || !back)) {
        return;
      }

      const standardKeys = new Set([
        "front",
        "back",
        "question",
        "answer",
        "id",
        "tags",
        "guid",
        "mid",
        "mod",
        "usn",
        "cards",
        "deckid",
        "deckname",
      ]);
      const customFields: Record<string, string> = {};
      for (const [key, val] of Object.entries(raw)) {
        if (!standardKeys.has(key.toLowerCase()) && val !== undefined && val !== null) {
          const strVal = typeof val === "string" ? val.trim() : typeof val === "object" ? JSON.stringify(val) : String(val);
          if (strVal) {
            customFields[key] = strVal;
          }
        }
      }

      cards.push({
        front,
        back,
        id: typeof raw.id === "string" || typeof raw.id === "number" ? raw.id : `card-${index + 1}`,
        tags: typeof raw.tags === "string" ? raw.tags : Array.isArray(raw.tags) ? raw.tags.join(" ") : undefined,
        ...(Object.keys(customFields).length > 0 ? { customFields } : {}),
      });
    });

    return {
      cards,
      deckTitle,
      deckStyle,
      matchedStrategy: this.id,
      diagnostics,
    };
  }
}
