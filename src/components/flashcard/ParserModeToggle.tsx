import { cn } from "@/lib/utils";
import { Sparkles, SlidersHorizontal } from "lucide-react";

/**
 * ParserModeToggle - Full-width edge-to-edge Segmented Mode Switch between
 * deterministic rules/patterns and contextual AI extraction.
 * Visually anchors and connects the selected strategy directly to the content below.
 */
export function ParserModeToggle({
  mode,
  onModeChange,
  disabled,
}: {
  mode: "regex" | "heuristic";
  onModeChange: (mode: "regex" | "heuristic") => void;
  disabled?: boolean;
}) {
  return (
    <div className="w-full space-y-2.5">
      {/* Edge-to-edge Segmented Mode Switch */}
      <div className="relative w-full p-1 rounded-xl bg-muted/80 border border-border/60 flex items-center shadow-inner">
        <button
          type="button"
          onClick={() => onModeChange("regex")}
          disabled={disabled}
          className={cn(
            "relative flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer select-none",
            mode === "regex"
              ? "bg-background text-foreground shadow-xs ring-1 ring-black/5 dark:ring-white/10 border-b-2 border-b-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
          <span>Rules & Patterns</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange("heuristic")}
          disabled={disabled}
          className={cn(
            "relative flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer select-none",
            mode === "heuristic"
              ? "bg-background text-foreground shadow-xs ring-1 ring-black/5 dark:ring-white/10 border-b-2 border-b-purple-600"
              : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>AI Extraction</span>
        </button>
      </div>

      {/* Contextual Subtitle bridging the mode switch to the content pane */}
      <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground leading-relaxed">
        <span
          className={cn(
            "w-2 h-2 rounded-full shrink-0 transition-colors",
            mode === "regex" ? "bg-primary" : "bg-purple-600"
          )}
        />
        <p className="flex-1">
          {mode === "regex" ? (
            <>
              <strong className="text-foreground font-medium">Rules:</strong> Fast, offline parsing based on delimiters and Markdown patterns.
            </>
          ) : (
            <>
              <strong className="text-foreground font-medium">AI:</strong> Contextual parsing for unstructured notes using local or cloud LLMs.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
