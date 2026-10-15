import { useParams, Link } from "react-router-dom";
import { getAllDecksSync, loadPublicDecksFromManifest, mergeDeckLists, fetchDeckCards, type Flashcard, type DeckInsights, type DeckSubset, type Deck } from "@/data/decks";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { BookOpen, Share2, BookmarkPlus, Download, Loader2, SlidersHorizontal, ChevronDown, FileSpreadsheet, FileJson, Package, LayoutList } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import AnkiBanner from "@/components/ui/anki-banner";
import { STORAGE_KEY, DEFAULT_MARKDOWN_CSS } from "@/components/flashcard/flashcard-utils";
import SettingsPanel from "@/components/flashcard/SettingsPanel";
import InteractivePreview from "@/components/flashcard/InteractivePreview";
import DeckMetadataCard from "@/components/flashcard/DeckMetadataCard";
import CardList from "@/components/flashcard/CardList";
import { createApkg } from "@/converters/jsonToApkg";

function toCardSortKey(card: Flashcard, index: number): number {
  if (typeof card.mod === "number" && Number.isFinite(card.mod) && card.mod > 0) {
    return card.mod * 1000;
  }

  const numericId = typeof card.id === "number" ? card.id : Number(card.id);
  if (Number.isFinite(numericId) && numericId > 0) return numericId;

  return -index;
}

function sortCardsNewestFirst(input: Flashcard[]): Flashcard[] {
  return [...input]
    .map((card, index) => ({ card, index }))
    .sort((a, b) => toCardSortKey(b.card, b.index) - toCardSortKey(a.card, a.index))
    .map((entry) => entry.card);
}

export default function DeckDetail() {
  const getAdaptivePreviewLimit = (items: Flashcard[]) => {
    if (items.length <= 80) return items.length;

    const sample = items.slice(0, Math.min(items.length, 80));
    const avgChars =
      sample.reduce((sum, c) => sum + (c.front?.length ?? 0) + (c.back?.length ?? 0), 0) /
      Math.max(sample.length, 1);

    if (avgChars > 2200) return 30;
    if (avgChars > 1200) return 45;
    if (avgChars > 700) return 60;
    if (items.length > 400) return 80;
    return 100;
  };
  const { id } = useParams<{ id: string }>();
  const [decks, setDecks] = useState<Deck[]>(getAllDecksSync());
  const [decksReady, setDecksReady] = useState(false);
  const deck = decks.find((d) => d.id === id);
  const [expandedBacks, setExpandedBacks] = useState<Record<string, boolean>>({});
  const [cards, setCards] = useState<Flashcard[]>(deck?.cards || []);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);
  const [deckStyle, setDeckStyle] = useState<string>("");
  const [deckInsights, setDeckInsights] = useState<DeckInsights | undefined>(deck?.insights);
  const [deckSubsets, setDeckSubsets] = useState<DeckSubset[] | undefined>(deck?.subsets);
  const [allCards, setAllCards] = useState<Flashcard[]>(deck?.cards || []);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showCardList, setShowCardList] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [customCss, setCustomCss] = useState<string>(() => {
    try { return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_MARKDOWN_CSS; } catch { return DEFAULT_MARKDOWN_CSS; }
  });

  useEffect(() => {
    loadPublicDecksFromManifest()
      .then((publicDecks) => {
        if (publicDecks.length > 0) {
          setDecks((prev) => mergeDeckLists(prev, publicDecks));
        }
      })
      .finally(() => {
        setDecksReady(true);
      });
  }, []);

  // Persist CSS whenever it changes
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, customCss); } catch { /* ignore */ }
  }, [customCss]);

  // Close download dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) {
        setDownloadOpen(false);
      }
    };
    if (downloadOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [downloadOpen]);

  useEffect(() => {
    if (deck) {
      setDeckInsights(deck.insights);
      setDeckSubsets(deck.subsets);

        if (deck.cards && deck.cards.length > 0) {
        const sortedDeckCards = sortCardsNewestFirst(deck.cards);
        setAllCards(sortedDeckCards);
          const previewLimit = getAdaptivePreviewLimit(sortedDeckCards);
          const shouldPreview = sortedDeckCards.length > previewLimit;
          setCards(shouldPreview ? sortedDeckCards.slice(0, previewLimit) : sortedDeckCards);
        setIsPreviewMode(shouldPreview);
            setLoading(false);
        } else if (deck.cardsUrl) {
            setLoading(true);
        fetchDeckCards(deck.cardsUrl).then(({ cards: fetchedCards, style, insights, subsets }) => {
          const sortedFetchedCards = sortCardsNewestFirst(fetchedCards);
          setAllCards(sortedFetchedCards);
            const previewLimit = getAdaptivePreviewLimit(sortedFetchedCards);
            const shouldPreview = sortedFetchedCards.length > previewLimit;
            setCards(shouldPreview ? sortedFetchedCards.slice(0, previewLimit) : sortedFetchedCards);
          setIsPreviewMode(shouldPreview);
                if (style) setDeckStyle(style);
          if (insights) setDeckInsights(insights);
          if (subsets && subsets.length > 0) setDeckSubsets(subsets);
                setLoading(false);
            }).catch((err) => {
                console.error("Failed to load cards", err);
                setLoading(false);
            });
        } else {
            setDeckInsights({
              cardCount: deck.cards?.length ?? 0,
              includesScheduling: false,
              newCount: 0,
              learningCount: 0,
              reviewCount: 0,
              suspendedCount: 0,
              taggedCardCount: 0,
            });
            setLoading(false);
        }
    }
  }, [deck]);

  if (!deck && !decksReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="container mx-auto py-20 px-4 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <BookOpen className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Deck not found</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          The flashcard deck you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild size="lg">
          <Link to="/">Browse all decks</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  const toggleExpand = (cardId: string) => {
    setExpandedBacks((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsJson = () => {
    const payload = {
      id: deck.id,
      title: deck.title,
      topic: deck.topic,
      author: deck.author,
      creationTag: deck.creationTag,
      style: deckStyle || deck.style,
      insights: deckInsights,
      cards,
    };
    const safeName = deck.title.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "deck";
    triggerDownload(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `${safeName}.json`);
  };

  const escapeCsv = (value: string) => {
    const normalized = String(value ?? "").replace(/\r?\n/g, "\n");
    return `"${normalized.replace(/"/g, '""')}"`;
  };

  const downloadAsCsv = () => {
    const header = ["front", "back", "tags", "deckName"];
    const rows = cards.map((c) => [c.front, c.back, c.tags ?? "", c.deckName ?? deck.title]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const safeName = deck.title.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "deck";
    triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${safeName}.csv`);
  };

  const downloadAsApkg = async () => {
    setIsExporting(true);
    try {
      if (!(window as any).initSqlJs) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "/sql-wasm.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load sql.js"));
          document.head.appendChild(script);
        });
      }

      const blob = await createApkg(
        cards.map((c) => ({ front: c.front, back: c.back, tags: c.tags })),
        deck.title,
        "markdown_basic",
        deckStyle || customCss
      );
      const safeName = deck.title.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "deck";
      triggerDownload(blob, `${safeName}.apkg`);
    } catch (err) {
      console.error("Failed to export APKG", err);
      alert(err instanceof Error ? err.message : "APKG Export fehlgeschlagen");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative container mx-auto py-8 px-4 md:px-6 max-w-7xl">
      {/* Mathematical grid background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-grid" />
      {/* Inject scoped CSS for markdown rendering */}
      <style>{customCss}</style>
      {/* Inject per-deck CSS extracted from the source file (e.g. Anki notetype styles) */}
      {deckStyle && <style>{deckStyle}</style>}

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        customCss={customCss}
        onCssChange={setCustomCss}
      />
      <AnkiBanner />

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/?topic=${deck.topic.toLowerCase()}`}>{deck.topic}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">{deck.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex items-center gap-2">
          <Button
            variant={showCardList ? "default" : "outline"}
            size="sm"
            className={`h-8 gap-2 transition-all ${showCardList ? "" : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300"}`}
            onClick={() => setShowCardList((v) => !v)}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kartenliste</span>
            <span className="text-[10px] opacity-80">{cards.length}</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-2 bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 transition-all" onClick={() => setSettingsOpen(true)}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Stile</span>
          </Button>
          {/* Download dropdown */}
          <div className="relative" ref={downloadRef}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 transition-all"
              onClick={() => setDownloadOpen((v) => !v)}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${downloadOpen ? "rotate-180" : ""}`} />
            </Button>
            {downloadOpen && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-zinc-200 bg-white shadow-lg shadow-black/5 z-50 overflow-hidden">
                <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Format wählen</div>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors text-left group" onClick={async () => { setDownloadOpen(false); await downloadAsApkg(); }}>
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/8 text-primary shrink-0"><Package className="w-4 h-4" /></span>
                  <div>
                    <div className="font-medium text-foreground">Anki-Paket <span className="text-xs text-muted-foreground font-normal">.apkg</span></div>
                    <div className="text-[11px] text-muted-foreground">Mit vorgefertigten Kartenstilen</div>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors text-left" onClick={() => { setDownloadOpen(false); downloadAsCsv(); }}>
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 shrink-0"><FileSpreadsheet className="w-4 h-4" /></span>
                  <div>
                    <div className="font-medium text-foreground">CSV-Datei <span className="text-xs text-muted-foreground font-normal">.csv</span></div>
                    <div className="text-[11px] text-muted-foreground">Kompatibel mit Tabellenkalkulationen</div>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors text-left" onClick={() => { setDownloadOpen(false); downloadAsJson(); }}>
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
          <Button variant="outline" size="sm" className="h-8 gap-2 bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 transition-all">
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-2 bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 transition-all">
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      </div>

      {isPreviewMode && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center justify-between gap-3">
          <span>
            Vorschau: {cards.length} von {allCards.length} Karten geladen.
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] bg-white"
            onClick={() => {
              setCards(allCards);
              setIsPreviewMode(false);
            }}
          >
            Alle laden
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8 items-stretch">
        <div className="xl:col-span-7 h-full">
          <DeckMetadataCard
            deck={deck}
            cardCount={allCards.length || cards.length}
            insights={deckInsights}
            subsets={deckSubsets}
            isExporting={isExporting}
            onDownloadApkg={downloadAsApkg}
            onDownloadCsv={downloadAsCsv}
            onDownloadJson={downloadAsJson}
          />
        </div>

        <div className="xl:col-span-5 flex flex-col gap-3 h-full">
          <InteractivePreview
            cards={cards}
          />
        </div>
      </div>

      {showCardList && (
        <div className="mb-8">
          <CardList
            cards={cards}
            expandedBacks={expandedBacks}
            onToggleExpand={toggleExpand}
          />
        </div>
      )}
    </div>
  );
}
