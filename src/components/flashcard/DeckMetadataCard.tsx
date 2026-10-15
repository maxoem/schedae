import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Calendar, Signal, User, Download, GraduationCap, ChevronDown, Package, FileSpreadsheet, FileJson, Clock3, Tags, Layers, Sparkles, FolderTree } from 'lucide-react';
import type { Deck, DeckInsights, DeckSubset } from '@/data/decks';
import { useState, useRef, useEffect } from 'react';

interface DeckMetadataCardProps {
  deck: Deck;
  cardCount: number;
  insights?: DeckInsights;
  subsets?: DeckSubset[];
  onDownloadApkg?: () => void | Promise<void>;
  onDownloadCsv?: () => void;
  onDownloadJson?: () => void;
  isExporting?: boolean;
}

interface TreeNode {
  name: string;
  fullName: string;
  cardCount: number;
  totalCardCount: number;
  children: Record<string, TreeNode>;
}

function buildDeckTree(subsets: DeckSubset[]): TreeNode {
  const root: TreeNode = { name: 'Root', fullName: '', cardCount: 0, totalCardCount: 0, children: {} };

  for (const subset of subsets) {
    const parts = subset.name.split('::');
    let current = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}::${part}` : part;
        if (!current.children[part]) {
            current.children[part] = { name: part, fullName: currentPath, cardCount: 0, totalCardCount: 0, children: {} };
        }
        current = current.children[part];
        
        if (i === parts.length - 1) {
            current.cardCount += subset.cardCount;
        }
    }
  }

  function computeTotals(node: TreeNode): number {
    let total = node.cardCount;
    for (const child of Object.values(node.children)) {
        total += computeTotals(child);
    }
    node.totalCardCount = total;
    return total;
  }
  computeTotals(root);

  return root;
}

function DeckTreeNodes({ nodes }: { nodes: TreeNode[] }) {
  if (!nodes.length) return null;
  return (
    <div className="flex flex-col w-full gap-1">
      {nodes.map(node => (
        <div key={node.fullName} className="flex flex-col">
           <div className="flex items-center justify-between py-1.5 px-3 rounded-md text-zinc-700 bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 transition-colors">
              <div className="flex items-center gap-2">
                 <Layers className="w-3.5 h-3.5 text-zinc-400" />
                 <span className="text-sm font-medium">{node.name}</span>
              </div>
              <span className="text-xs font-semibold bg-white border border-zinc-200 px-2 py-0.5 rounded-md min-w-[1.5rem] text-center shadow-sm">
                {node.totalCardCount}
              </span>
           </div>
           {Object.keys(node.children).length > 0 && (
               <div className="pl-3 mt-1 ml-2.5 border-l-[1.5px] border-zinc-200/70">
                   <DeckTreeNodes nodes={Object.values(node.children)} />
               </div>
           )}
        </div>
      ))}
    </div>
  );
}

export default function DeckMetadataCard({ deck, cardCount, insights, subsets, onDownloadApkg, onDownloadCsv, onDownloadJson, isExporting }: DeckMetadataCardProps) {
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);
  const aiTagged = (deck.creationTag ?? '').toLowerCase().includes('ai');
  const treeRoot = subsets?.length ? buildDeckTree(subsets) : null;
  const rootNodes = treeRoot ? Object.values(treeRoot.children) : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node))
        setDownloadOpen(false);
    };
    if (downloadOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [downloadOpen]);

  return (
    <Card className="shadow-none rounded-3xl overflow-hidden bg-[rgba(250,250,251,0.97)] border-zinc-200 h-full flex flex-col" style={{boxShadow:"0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)"}}>
      <CardHeader className="pb-2 pt-4 px-5 space-y-3 border-b border-zinc-200/70">
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="text-foreground border-black hover:bg-secondary/50 font-medium px-3 py-1 rounded-md text-xs uppercase tracking-wider"
            >
              {deck.topic}
            </Badge>
            {deck.creationTag && (
              <Badge
                variant="outline"
                className={`px-3 py-1 rounded-md text-xs tracking-wider ${aiTagged ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-zinc-200 bg-zinc-100 text-zinc-700'}`}
              >
                {aiTagged && <Sparkles className="w-3.5 h-3.5 mr-1" />}
                {deck.creationTag}
              </Badge>
            )}
          </div>
          <span className="text-xs font-medium text-muted-foreground/70 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200">
            <BookOpen className="w-3.5 h-3.5" />
            {cardCount} cards
          </span>
        </div>

        <div className="space-y-2">
          <CardTitle className="text-2xl md:text-[1.7rem] font-bold tracking-tight text-foreground/90 leading-tight">
            {deck.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground/80 leading-relaxed">
            {deck.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-4 bg-transparent flex flex-col flex-1">
        <div className="flex flex-col gap-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-1.5">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">Author</div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-foreground/60 bg-white border border-zinc-200 shrink-0">
                  {deck.author ? (
                    <span className="font-semibold text-[10px]">{deck.author.substring(0, 2).toUpperCase()}</span>
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="font-medium text-foreground/80 text-sm truncate" title={deck.author}>{deck.author}</span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">Updated</div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                {new Date(deck.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">Complexity</div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                <Signal className="w-3.5 h-3.5 text-zinc-500" />
                {deck.complexity}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">Level</div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                <GraduationCap className="w-3.5 h-3.5 text-zinc-500" />
                {deck.level}
              </div>
            </div>
          </div>

          <Separator className="bg-border/30" />

          <div className="flex items-center gap-2 flex-wrap">
            {insights?.includesScheduling && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-zinc-600 text-xs font-medium bg-zinc-100 border border-zinc-200">
                <Clock3 className="w-3.5 h-3.5 text-zinc-400" />
                {insights.reviewCount} Review · {insights.learningCount} Lernen · {insights.newCount} Neu
              </div>
            )}
            {!!insights?.taggedCardCount && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-zinc-600 text-xs font-medium bg-zinc-100 border border-zinc-200">
                <Tags className="w-3.5 h-3.5 text-zinc-400" />
                {insights.taggedCardCount} mit Tags
              </div>
            )}
            {!!insights?.deckPathCount && insights.deckPathCount > 1 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-zinc-600 text-xs font-medium bg-zinc-100 border border-zinc-200">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                {insights.deckPathCount} Deck-Pfade
              </div>
            )}
            {!!insights?.noteCount && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-zinc-600 text-xs font-medium bg-zinc-100 border border-zinc-200">
                <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                {insights.noteCount} Notizen
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5" />
                Deck-Struktur
              </div>
              <div className="text-[11px] text-muted-foreground/70">
                {rootNodes.length > 0 ? `${rootNodes.length} Subsets` : 'Einzeldeck'}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-2.5">
              <div className="flex items-center justify-between py-1 px-1.5">
                <div className="text-sm font-semibold text-zinc-800 truncate" title={deck.title}>{deck.title}</div>
                <span className="text-xs font-semibold bg-white border border-zinc-200 px-2 py-0.5 rounded-md min-w-[1.5rem] text-center shadow-sm">
                  {cardCount}
                </span>
              </div>

              {rootNodes.length > 0 ? (
                <div className="mt-1.5 border-t border-zinc-200/70 pt-1.5 max-h-56 overflow-auto pr-1">
                  <DeckTreeNodes nodes={rootNodes} />
                </div>
              ) : (
                <div className="mt-1 text-xs text-muted-foreground/80 px-1.5">Keine Subsets vorhanden.</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 relative" ref={downloadRef}>
          <Button
            className="w-full h-12 rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 font-semibold shadow-none gap-2"
            disabled={isExporting}
            onClick={() => setDownloadOpen((v) => !v)}
          >
            <Download className="w-4 h-4 fill-current" />
            {isExporting ? "Exportiere..." : "Herunterladen"}
            <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${downloadOpen ? 'rotate-180' : ''}`} />
          </Button>
          {downloadOpen && (
            <div className="absolute bottom-full mb-2 left-0 w-full rounded-xl border border-zinc-200 bg-white shadow-lg shadow-black/5 z-50 overflow-hidden">
              <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Format wählen</div>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors text-left" onClick={async () => { setDownloadOpen(false); if (onDownloadApkg) await onDownloadApkg(); }}>
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/8 text-primary shrink-0"><Package className="w-4 h-4" /></span>
                <div>
                  <div className="font-medium text-foreground">Anki-Paket <span className="text-xs text-muted-foreground font-normal">.apkg</span></div>
                  <div className="text-[11px] text-muted-foreground">Mit vorgefertigten Kartenstilen</div>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors text-left" onClick={() => { setDownloadOpen(false); onDownloadCsv?.(); }}>
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 shrink-0"><FileSpreadsheet className="w-4 h-4" /></span>
                <div>
                  <div className="font-medium text-foreground">CSV-Datei <span className="text-xs text-muted-foreground font-normal">.csv</span></div>
                  <div className="text-[11px] text-muted-foreground">Kompatibel mit Tabellenkalkulationen</div>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors text-left" onClick={() => { setDownloadOpen(false); onDownloadJson?.(); }}>
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 text-amber-600 shrink-0"><FileJson className="w-4 h-4" /></span>
                <div>
                  <div className="font-medium text-foreground">JSON-Datei <span className="text-xs text-muted-foreground font-normal">.json</span></div>
                  <div className="text-[11px] text-muted-foreground">Rohdaten für eigene Verarbeitung</div>
                </div>
              </button>
              <div className="mx-3 my-2 h-px bg-zinc-100" />
              <div className="px-3 pb-2.5 text-[10px] text-muted-foreground/60 leading-relaxed">
                Alle Pakete enthalten Anki-Kartenstile &amp; Vorlagen.
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
