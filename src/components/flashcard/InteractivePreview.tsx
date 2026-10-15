import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { Flashcard } from '@/data/decks';
import FlashcardItem from './FlashcardItem';
import { useEffect, useState } from 'react';
import { createMarkup } from './flashcard-utils';

interface InteractivePreviewProps {
  cards: Flashcard[];
}

export default function InteractivePreview({ cards }: InteractivePreviewProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prerenderedHtmlById, setPrerenderedHtmlById] = useState<Record<string, { front: string, back: string }>>({});

  useEffect(() => {
    if (!api) return;

    const onSelect = () => setCurrentIndex(api.selectedScrollSnap());
    onSelect();
    api.on('select', onSelect);

    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    const idle = (window as any).requestIdleCallback as
      | ((cb: () => void) => number)
      | undefined;

    for (let offset = 0; offset <= 5; offset++) {
      const idx = currentIndex + offset;
      const card = cards[idx];
      if (!card) continue;
      if (prerenderedHtmlById[card.id]) continue;

      const run = () => {
        if (cancelled) return;
        const frontHtml = createMarkup(card.front).__html;
        const backHtml = createMarkup(card.back).__html;
        if (cancelled) return;
        setPrerenderedHtmlById((prev) => (prev[card.id] ? prev : { ...prev, [card.id]: { front: frontHtml, back: backHtml } }));
      };

      if (idle) {
        idle(run);
      } else {
        window.setTimeout(run, 0);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [cards, currentIndex, prerenderedHtmlById]);

  return (
    <div className="p-4 sm:p-6 rounded-3xl h-full relative flex flex-col" style={{background:"rgba(250,250,251,0.97)",border:"1px solid rgba(228,228,231,0.9)",boxShadow:"0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)"}}>
      <div className="flex items-center justify-center mb-6 shrink-0">
        <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-900">Kartenvorschau</h2>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center min-h-[440px]">
        <Carousel className="w-full max-w-2xl z-10" setApi={setApi}>
          <CarouselContent>
            {cards.map((card, index) => (
              <CarouselItem key={card.id}>
                <FlashcardItem
                  card={card}
                  index={index}
                  total={cards.length}
                  preRenderedFrontHtml={prerenderedHtmlById[card.id]?.front}
                  preRenderedBackHtml={prerenderedHtmlById[card.id]?.back}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-between items-center mt-6 gap-4">
            <CarouselPrevious className="static translate-y-0 h-10 w-10 bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 shadow-sm" />
            <div className="text-xs font-medium text-zinc-500">
              Karte {currentIndex + 1} von {cards.length}
            </div>
            <CarouselNext className="static translate-y-0 h-10 w-10 bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 shadow-sm" />
          </div>
        </Carousel>
      </div>
    </div>
  );
}
