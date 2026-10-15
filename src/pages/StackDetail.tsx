import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { mockStacks, getDeckCardCount, getAllDecksSync, loadPublicDecksFromManifest, compareDecksNewestFirst, type Deck } from "@/data/decks";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, User, ArrowRight, Signal, GraduationCap, Layers } from "lucide-react";
import SpotlightCard from "@/components/ui/spotlight-card";
import AnkiBanner from "@/components/ui/anki-banner";

// Monochromatic header — using subtle colored gradients for each stack
const accentMap: Record<string, string> = {
  violet:  "from-violet-950 via-violet-900/80 to-zinc-950",
  blue:    "from-blue-950 via-blue-900/80 to-zinc-950",
  emerald: "from-emerald-950 via-emerald-900/80 to-zinc-950",
  amber:   "from-amber-950 via-amber-900/80 to-zinc-950",
  rose:    "from-rose-950 via-rose-900/80 to-zinc-950",
};

const badgeMap: Record<string, string> = {
  violet:  "bg-violet-500/10 text-violet-300 border-violet-500/20",
  blue:    "bg-blue-500/10 text-blue-300 border-blue-500/20",
  emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  amber:   "bg-amber-500/10 text-amber-300 border-amber-500/20",
  rose:    "bg-rose-500/10 text-rose-300 border-rose-500/20",
};

export default function StackDetail() {
  const { id } = useParams<{ id: string }>();
  const [allDecks, setAllDecks] = useState<Deck[]>(getAllDecksSync());

  useEffect(() => {
    loadPublicDecksFromManifest().then((publicDecks) => {
      if (!publicDecks.length) return;
      setAllDecks(getAllDecksSync());
    });
  }, []);

  const stack = mockStacks.find((s) => s.id === id);

  if (!stack) {
    return (
      <div className="mx-auto w-[92%] md:w-[80%] max-w-7xl py-24 text-center">
        <h2 className="text-2xl font-bold mb-2">Stack nicht gefunden</h2>
        <p className="text-muted-foreground mb-6">Dieser Lernpfad existiert nicht.</p>
        <Button asChild>
          <Link to="/">Zurück zur Übersicht</Link>
        </Button>
      </div>
    );
  }

  const decks = allDecks
    .filter((d) => stack.deckIds.includes(d.id))
    .sort(compareDecksNewestFirst);
  const gradient = accentMap[stack.color] ?? accentMap.violet;
  const badgeCls = badgeMap[stack.color] ?? badgeMap.violet;

  return (
    <div className="min-h-screen w-full">
      {/* Hero banner */}
      <div className={`w-full bg-gradient-to-br ${gradient} pt-12 pb-16 px-4`}>
        <div className="mx-auto w-[92%] md:w-[80%] max-w-7xl">
          <Breadcrumb className="mb-6 opacity-60">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="text-white/70 hover:text-white">Startseite</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white/40" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">{stack.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="max-w-2xl">
              <Badge className={`${badgeCls} border mb-4 font-semibold text-xs uppercase tracking-widest px-2.5 py-1`}>
                {stack.discipline}
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 leading-tight">
                {stack.title}
              </h1>
              <p className="text-white/50 text-sm font-medium mb-4 tracking-wide">{stack.subtitle}</p>
              <p className="text-white/70 text-lg leading-relaxed">{stack.description}</p>
            </div>

            <div className="flex flex-col gap-3 text-white/70 text-sm bg-white/5 rounded-2xl p-5 border border-white/10 md:min-w-[180px]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span><strong className="text-white">{decks.length}</strong> Datensätze</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>
                  <strong className="text-white">
                    {decks.reduce((s, d) => s + (d.cards?.length ?? 0), 0) || stack.totalCards}
                  </strong>{" "}
                  Karten
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deck grid */}
      <div className="mx-auto w-[92%] md:w-[80%] max-w-7xl py-12">
        <AnkiBanner />
        <h2 className="text-2xl font-bold mb-8 text-foreground">Datensätze in diesem Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {decks.map((deck) => (
            <SpotlightCard
              key={deck.id}
              spotlightColor="rgba(0, 0, 0, 0.035)"
              className="flex flex-col h-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden rounded-2xl relative"
              style={{background: "rgba(250,250,251,0.97)", border: "1px solid rgba(228,228,231,0.9)", boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)"}}
            >

              <CardHeader className="pb-2 pt-8 px-8 flex-grow space-y-4">
                <div className="flex justify-between items-start w-full">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 font-medium px-3 py-1 rounded-md text-xs uppercase tracking-wider">
                    {deck.topic}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground/60 flex items-center gap-1.5 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-md">
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
                  <div className="flex items-center justify-between text-sm border-b border-border/40 pb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span className="font-medium truncate max-w-[120px]">{deck.author}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground/80">
                      <Calendar className="w-4 h-4" />
                      <span className="whitespace-nowrap">
                        {new Date(deck.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-medium">
                      <Signal className="w-3.5 h-3.5" />
                      {deck.complexity}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-medium">
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
      </div>
    </div>
  );
}
