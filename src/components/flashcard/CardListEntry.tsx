import type { Flashcard } from '@/data/decks';
import { createMarkup } from './flashcard-utils';

interface CardListEntryProps {
  card: Flashcard;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function CardListEntry({ card, index, isExpanded, onToggleExpand }: CardListEntryProps) {
  const schedule = card.scheduling;
  const status = (() => {
    if (!schedule) return null;
    if (schedule.queue === -1) return { label: "Suspendiert", tone: "bg-zinc-100 text-zinc-600 border-zinc-200" };
    if (schedule.queue === 2 || schedule.type === 2) return { label: "Review", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (schedule.queue === 1 || schedule.queue === 3) return { label: "Lernen", tone: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "Neu", tone: "bg-blue-50 text-blue-700 border-blue-200" };
  })();

  return (
    <div className="group flex flex-col gap-3 p-6 hover:bg-white/30 transition-colors w-full">
      <div className="flex items-center gap-2 mb-1">
        <span className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground text-[10px] font-bold transition-colors group-hover:text-foreground" style={{background:"rgba(255,255,255,0.55)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.70)"}}>
          {index + 1}
        </span>
        {status && (
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${status.tone}`}>
            {status.label}
          </span>
        )}
        {typeof schedule?.due === "number" && schedule.due > 0 && (
          <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
            Due {schedule.due}
          </span>
        )}
        {card.tags && (
          <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 max-w-[180px] truncate">
            {card.tags}
          </span>
        )}
      </div>
      {card.deckName && (
        <div className="-mt-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
          {card.deckName}
        </div>
      )}

      <div className="space-y-1 w-full">
        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider block">Front</span>
        <div
          className="flashcard-prose w-full break-words whitespace-normal"
          dangerouslySetInnerHTML={createMarkup(card.front)}
        />
      </div>

      <div className="space-y-1 pt-2 w-full">
        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider block">Back</span>
        <div className="relative">
          <div
            className={`flashcard-prose w-full break-words whitespace-normal overflow-hidden transition-all duration-300${!isExpanded && card.back.length > 250 ? ' max-h-24' : ''}`}
            dangerouslySetInnerHTML={createMarkup(card.back)}
          />
          {card.back.length > 250 && (
            <div className="relative">
              {!isExpanded && (
                <div className="absolute -top-12 left-0 right-0 h-12 bg-gradient-to-b from-transparent to-white/70 pointer-events-none" />
              )}
              <button
                onClick={onToggleExpand}
                className="w-full text-center text-[11px] font-semibold text-muted-foreground/50 hover:text-primary transition-colors pt-1"
              >
                {isExpanded ? 'Weniger anzeigen ↑' : 'Mehr anzeigen ↓'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
