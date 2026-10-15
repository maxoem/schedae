import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Flashcard } from '@/data/decks';
import CardListEntry from './CardListEntry';

interface CardListProps {
  cards: Flashcard[];
  expandedBacks: Record<string, boolean>;
  onToggleExpand: (cardId: string) => void;
}

export default function CardList({ cards, expandedBacks, onToggleExpand }: CardListProps) {
  return (
    <Card className="shadow-none rounded-3xl flex-grow flex flex-col overflow-hidden" style={{background:"rgba(255,255,255,0.55)",backdropFilter:"blur(20px) saturate(180%)",WebkitBackdropFilter:"blur(20px) saturate(180%)",border:"1px solid rgba(255,255,255,0.75)",boxShadow:"0 8px 32px rgba(80,60,180,0.08), inset 0 1px 0 rgba(255,255,255,0.9)"}}>
      <CardHeader className="pb-4 px-6 pt-6 bg-transparent border-b border-border/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold tracking-tight">Enthaltene Karten</CardTitle>
          <Badge variant="outline" className="font-medium text-xs text-muted-foreground" style={{background:"rgba(255,255,255,0.50)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.65)"}}>
            {cards.length} total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-grow bg-transparent">
        <ScrollArea className="h-[400px]">
          <div className="flex flex-col divide-y divide-border/20">
            {cards.map((card, index) => (
              <CardListEntry
                key={card.id}
                card={card}
                index={index}
                isExpanded={!!expandedBacks[card.id]}
                onToggleExpand={() => onToggleExpand(card.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
