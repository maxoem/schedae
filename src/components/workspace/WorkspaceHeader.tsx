import React, { useState, useRef, useEffect } from "react";
import { Download, Sparkles, Pencil, Check, Layers, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WorkspaceHeaderProps {
  deckName: string;
  onDeckNameChange: (name: string) => void;
  cardCount: number;
  batchCount: number;
  isProcessing: boolean;
  onExport: () => void;
  onOpenParserSettings?: () => void;
  hasCustomRules?: boolean;
  draftCount?: number;
  savedCount?: number;
}

export function WorkspaceHeader({
  deckName,
  onDeckNameChange,
  cardCount,
  batchCount,
  isProcessing,
  onExport,
  onOpenParserSettings,
  hasCustomRules,
  draftCount = 0,
  savedCount = 0,
}: WorkspaceHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(deckName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleDraft(deckName);
  }, [deckName]);

  useEffect(() => {
    if (isEditingTitle) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingTitle]);

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed) onDeckNameChange(trimmed);
    else setTitleDraft(deckName);
    setIsEditingTitle(false);
  };

  return (
    <header className="w-full bg-white border-b border-zinc-200/80 shrink-0">
      <div className="max-w-[1920px] mx-auto w-full px-4 md:px-6 h-11 md:h-12 flex items-center justify-between gap-3">
        {/* Left: Editable Deck Title & Status Badges */}
        <div className="flex items-center gap-2.5 min-h-[32px]">
          {/* Subtle Deck Icon */}
          <div className="w-7 h-7 rounded-md bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0" title="Deck">
            <Layers className="w-3.5 h-3.5" />
          </div>

          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 h-8">
              <input
                ref={inputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTitle();
                  if (e.key === "Escape") {
                    setTitleDraft(deckName);
                    setIsEditingTitle(false);
                  }
                }}
                className="h-8 text-base md:text-lg font-semibold tracking-tight bg-white border border-zinc-300 rounded-md px-2 focus:outline-hidden focus:ring-2 focus:ring-zinc-950/20 text-foreground"
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={commitTitle}>
                <Check className="w-4 h-4 text-primary" />
              </Button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              className="group flex items-center gap-1.5 cursor-pointer rounded-md px-2 py-1 -ml-1.5 hover:bg-zinc-100 transition-colors h-8"
              title="Click to rename deck"
            >
              <h1 className="text-base md:text-lg font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                <span>{deckName || "Untitled Deck"}</span>
                <Pencil className="w-3 h-3 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
              </h1>
            </div>
          )}

          {batchCount > 0 && (
            <Badge
              variant="secondary"
              className="text-[11px] font-medium py-0.5 px-2.5 bg-zinc-100 text-zinc-600 border border-zinc-200/80 rounded-full"
            >
              {batchCount} {batchCount === 1 ? "Batch" : "Batches"}
            </Badge>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onOpenParserSettings && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenParserSettings}
              className="gap-1.5 h-8 px-3 text-xs font-medium border-zinc-200/90 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 shadow-2xs transition-colors"
              title="Configure delimiters and parsing rules (Ctrl+M)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
              <span>Parser Rules</span>
              {hasCustomRules && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Custom rules active" />
              )}
            </Button>
          )}

          <Button
            size="sm"
            onClick={onExport}
            disabled={cardCount === 0 || isProcessing}
            className="gap-1.5 h-8 px-3 text-xs font-semibold shadow-xs transition-all duration-200"
            title={
              draftCount > 0 && savedCount > 0
                ? `Export all ${cardCount} cards (${savedCount} saved in batches + ${draftCount} in active draft)`
                : `Export all ${cardCount} cards to .apkg`
            }
          >
            {isProcessing ? (
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export .apkg</span>
            <Badge
              variant="secondary"
              className="ml-0.5 px-1.5 py-0 text-[10px] font-bold bg-primary-foreground/20 text-primary-foreground rounded-full"
            >
              {cardCount}
            </Badge>
          </Button>
        </div>
      </div>
    </header>
  );
}
