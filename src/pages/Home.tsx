import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { mockDecks, mockStacks, getDeckCardCount, loadPublicDecksFromManifest, mergeDeckLists, compareDecksNewestFirst, type Deck } from "@/data/decks";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { BookOpen, Calendar, User, ArrowRight, Sparkles, GraduationCap, Signal, Layers, Search, X } from "lucide-react";
import SpotlightCard from "@/components/ui/spotlight-card";
import StackCard from "@/components/flashcard/StackCard";
import AnkiBanner from "@/components/ui/anki-banner";

export default function Home() {
  const [activeTab, setActiveTab] = useState("alle");
  const [decks, setDecks] = useState<Deck[]>(mockDecks);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  useEffect(() => {
    loadPublicDecksFromManifest().then((publicDecks) => {
      if (!publicDecks.length) return;
      setDecks((prev) => mergeDeckLists(prev, publicDecks));
    });
  }, []);

  const handleInlineSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    const next = new URLSearchParams(searchParams);
    if (q.trim()) next.set("q", q);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const normalize = (s: string) => s.toLowerCase();

  // Preserve exact scientific topic titles while filtering case-insensitively
  const uniqueTopics = Array.from(new Set(decks.map(deck => deck.topic).filter(Boolean)));
  const topics = ["alle", ...uniqueTopics];

  const tabFilteredDecks = activeTab === "alle"
    ? decks
    : decks.filter(deck => deck.topic.toLowerCase() === activeTab.toLowerCase());

  const filteredDecks = query.trim()
    ? tabFilteredDecks.filter(deck =>
        normalize(deck.title).includes(normalize(query)) ||
        normalize(deck.description).includes(normalize(query)) ||
        normalize(deck.topic).includes(normalize(query)) ||
        normalize(deck.author).includes(normalize(query)) ||
        normalize(deck.complexity).includes(normalize(query))
      )
    : tabFilteredDecks;

  const orderedDecks = [...filteredDecks].sort(compareDecksNewestFirst);

  const filteredStacks = query.trim()
    ? mockStacks.filter(stack =>
        normalize(stack.title).includes(normalize(query)) ||
        normalize(stack.subtitle).includes(normalize(query)) ||
        normalize(stack.description).includes(normalize(query)) ||
        normalize(stack.discipline).includes(normalize(query))
      )
    : mockStacks;

  return (
    <div className="relative container mx-auto py-12 px-4 md:px-6 max-w-7xl">
      {/* Precise mathematical grid background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-grid" />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div className="flex flex-col gap-4 max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
            Spezifische Datensätze zur <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Memorisation & Vertiefung.</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl">
            Präzise wissenschaftliche Repräsentationen für Epistemologie, Infinitesimalrechnung, Stochastik und Theoretische Informatik. Exakte Terminologie und LLM-optimierte Roundtrip-Pipelines.
          </p>
        </div>
      </div>

      {/* ── Anki Info Banner ───────────────────────────────────────────── */}
      <AnkiBanner />

      {/* ── Stacks Section ─────────────────────────────────────────────── */}
      <section className="mb-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg glass-subtle">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">Systematiken</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Thematische Cluster
            </h2>
            <p className="text-muted-foreground mt-1 text-sm md:text-base max-w-xl">
              Thematisch kuratierte Sammlungen, die zusammengehörige Datensätze zu einem Lernpfad bündeln.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStacks.map((stack) => (
            <StackCard key={stack.id} stack={stack} />
          ))}
        </div>
        {filteredStacks.length === 0 && (
          <div className="text-center py-14 bg-muted/10 rounded-2xl border border-dashed border-border/60">
            <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Keine Stacks für <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>
            </p>
          </div>
        )}
      </section>

      {/* ── Divider + Decks Header ────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-10">
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-1.5 rounded-full glass-subtle">
          Einzeldatensätze
        </span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      <Tabs defaultValue="alle" className="w-full mb-12" onValueChange={setActiveTab}>
        {/* Tabs + search on same row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="overflow-x-auto pb-1 scrollbar-hide shrink-0">
            <TabsList className="h-auto p-1 rounded-full inline-flex" style={{background: "rgba(244,244,245,0.97)", border: "1px solid rgba(228,228,231,0.90)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)"}}>
              {topics.map(topic => (
                <TabsTrigger
                  key={topic}
                  value={topic}
                  className="px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  {topic === "alle" ? "Alle" : topic}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Inline search */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <Input
              value={query}
              onChange={handleInlineSearch}
              placeholder="Suchen…"
              className="pl-10 pr-9 h-10 rounded-full text-sm transition-colors focus-visible:ring-1 focus-visible:ring-foreground/25"
              style={{background: "rgba(250,250,251,0.97)", backdropFilter: "none", WebkitBackdropFilter: "none", border: "1px solid rgba(228,228,231,0.90)"}}
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Result count */}
        {query.trim() && (
          <p className="text-sm text-muted-foreground mb-6 -mt-2">
            <span className="font-semibold text-foreground">{orderedDecks.length}</span>{" "}
            Datensatz{filteredDecks.length !== 1 ? "e" : ""} für{" "}
            <span className="font-semibold text-foreground">&ldquo;{query}&rdquo;</span>
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {orderedDecks.map((deck) => (
            <SpotlightCard key={deck.id} spotlightColor="rgba(0, 0, 0, 0.035)" className="flex flex-col h-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group rounded-2xl relative overflow-hidden" style={{background: "rgba(250,250,251,0.97)", border: "1px solid rgba(228,228,231,0.9)", boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)"}}>
              
              <CardHeader className="pb-2 pt-8 px-8 flex-grow space-y-4">
                <div className="flex justify-between items-start w-full">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 font-medium px-3 py-1 rounded-md text-xs uppercase tracking-wider">
                    {deck.topic}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground/60 flex items-center gap-1.5 glass-subtle px-2.5 py-1 rounded-md">
                    <BookOpen className="w-3.5 h-3.5" />
                    {getDeckCardCount(deck) ?? "–"}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold tracking-tight text-foreground/90 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                    {deck.title}
                  </CardTitle>
                  {deck.creationTag && (
                    <Badge variant="outline" className="text-[10px] w-fit bg-zinc-50 border-zinc-200 text-zinc-600">
                      {deck.creationTag}
                    </Badge>
                  )}
                  <CardDescription className="line-clamp-3 text-base text-muted-foreground/80 leading-relaxed min-h-[4.5rem]">
                    {deck.description}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="px-8 py-4">
                <div className="flex flex-col gap-4">
                  {/* Primary Meta: Author & Date */}
                  <div className="flex items-center justify-between text-sm border-b border-border/40 pb-4">
                     <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <User className="w-4 h-4" />
                        <span className="font-medium truncate max-w-[120px]" title={deck.author}>{deck.author}</span>
                     </div>
                     <div className="flex items-center gap-2 text-muted-foreground/80" title="Last updated">
                        <Calendar className="w-4 h-4" />
                        <span className="whitespace-nowrap">
                          {new Date(deck.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                     </div>
                  </div>

                  {/* Secondary Meta: Stats/Tags */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md glass-subtle text-foreground/70 text-xs font-medium">
                      <Signal className="w-3.5 h-3.5" />
                      {deck.complexity}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md glass-subtle text-foreground/70 text-xs font-medium">
                      <GraduationCap className="w-4 h-4" />
                      {deck.level}
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="px-8 pb-8 pt-2 mt-auto">
                <Button asChild className="w-full h-11 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Link to={`/deck/${deck.id}`} className="flex items-center justify-center gap-2 font-semibold">
                    <span>Datensatz öffnen</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardFooter>
            </SpotlightCard>
          ))}
        </div>
        
        {orderedDecks.length === 0 && (
          <div className="text-center py-24 bg-muted/10 rounded-2xl border border-dashed border-border/60">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
              {query.trim()
                ? <Search className="w-8 h-8 text-muted-foreground/40" />
                : <BookOpen className="w-8 h-8 text-muted-foreground/40" />
              }
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {query.trim() ? `Keine Treffer für „${query}"` : "Keine Datensätze gefunden"}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {query.trim()
                ? "Versuche einen anderen Suchbegriff oder lösche den Filter."
                : "Für diesen Filter existieren keine Einträge."}
            </p>
            {query.trim() && (
              <Button variant="outline" size="sm" className="mt-4" onClick={clearSearch}>
                Suche zurücksetzen
              </Button>
            )}
          </div>
        )}
      </Tabs>
    </div>
  );
}
