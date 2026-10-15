import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import type { FlashCard } from "@/converters/types";

interface ValidationWarning {
  type: "empty-back" | "json-error" | "parse-error" | "empty-content";
  message: string;
  cardIndex?: number;
}

export function ValidationWarnings({
  cards,
  totalCards,
  parseError,
}: {
  cards: FlashCard[];
  totalCards: number;
  parseError: string | null;
}) {
  const warnings = useMemo(() => {
    const w: ValidationWarning[] = [];

    if (parseError) {
      w.push({ type: "parse-error", message: parseError });
      return w;
    }

    for (let i = 0; i < cards.length; i++) {
      if (!cards[i]?.back || cards[i].back?.trim() === "") {
        w.push({
          type: "empty-back",
          message: `Card ${i + 1} has an empty answer/back side`,
          cardIndex: i,
        });
      }
    }

    return w;
  }, [cards, totalCards, parseError]);

  if (warnings.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 mt-3 mb-1">
      {warnings.map((w: ValidationWarning, i: number) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded border shrink-0",
            w.type === "parse-error"
              ? "bg-destructive/10 text-destructive border-destructive/30"
              : w.type === "empty-back"
              ? "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30"
              : "bg-muted/50 text-muted-foreground border-muted/50",
          )}
        >
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>{w.message}</span>
        </div>
      ))}
    </div>
  );
}
