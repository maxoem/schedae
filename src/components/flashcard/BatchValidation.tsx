import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";
import type { FlashCard } from "@/converters/types";
import { useMemo } from "react";

interface ValidationError {
  type: "empty-back" | "json-error" | "parse-error" | "no-cards";
  message: string;
  line?: number;
  cardIndex?: number;
}

/**
 * Validates a batch of cards against the current template and shows warnings inline.
 * This is the IDE-style "problems panel" — no modal popups, just clear indicators.
 */
export function BatchValidation({
  cards,
  batchIndex,
  totalBatches,
  parseError,
  jsonError,
}: {
  cards: FlashCard[];
  batchIndex: number;
  totalBatches: number;
  parseError: string | null;
  jsonError: string | null;
}) {
  const warnings = useMemo<ValidationError[]>(() => {
    const w: ValidationError[] = [];
    const batchNum = totalBatches - batchIndex;

    if (parseError) {
      w.push({ type: "parse-error", message: parseError });
      return w;
    }

    if (jsonError) {
      w.push({ type: "json-error", message: jsonError });
      return w;
    }

    if (!cards || cards.length === 0) {
      w.push({ type: "no-cards", message: `Batch ${batchNum} contains no cards` });
      return w;
    }

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card) {
        w.push({ type: "empty-back", message: `Card ${i + 1} is null/undefined`, cardIndex: i, line: i + 1 });
        continue;
      }
      if (!card.front || card.front.trim().length === 0) {
        w.push({ type: "empty-back", message: `Card ${i + 1} has an empty question/front side`, cardIndex: i, line: i + 1 });
      }
      if (!card.back || card.back.trim().length === 0) {
        w.push({ type: "empty-back", message: `Card ${i + 1} has an empty answer/back side`, cardIndex: i, line: i + 1 });
      }
      if (card.back && card.back.trim().length > 0 && card.front && card.front.includes(card.back.trim())) {
        w.push({
          type: "empty-back",
          message: `Card ${i + 1}: answer content appears duplicated in question`,
          cardIndex: i,
          line: i + 1,
        });
      }
    }

    return w;
  }, [cards, batchIndex, totalBatches, parseError, jsonError]);

  if (warnings.length === 0) return null;

  const hasCritical = warnings.some((w) => w.type === "parse-error" || w.type === "json-error" || w.type === "no-cards");

  return (
    <div className="flex flex-col gap-1 mt-2 mb-1">
      {warnings.map((w: ValidationError, i: number) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-2 text-[11px] font-medium px-2.5 py-1 rounded shrink-0",
            w.type === "parse-error" || w.type === "json-error" || w.type === "no-cards"
              ? "bg-destructive/10 text-destructive/90 border border-destructive/30"
              : "bg-amber-500/10 text-amber-500 border border-amber-500/30",
          )}
        >
          {w.type === "parse-error" || w.type === "json-error" || w.type === "no-cards" ? (
            <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center" style={{ fontSize: 12 }}>✕</span>
          ) : (
            <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center" style={{ fontSize: 11 }}>⚠</span>
          )}
          <span className="flex-1">{w.message}</span>
          {w.line != null && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-black/5">
              L{w.line}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
