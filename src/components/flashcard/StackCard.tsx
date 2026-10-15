import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Layers, GraduationCap } from "lucide-react";
import type { DeckStack, StackColor } from "@/data/decks";
import { getAllDecksSync, getDeckCardCount, compareDecksNewestFirst } from "@/data/decks";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Color configuration – all classes listed statically so Tailwind JIT keeps them
// ---------------------------------------------------------------------------
type ColorConfig = {
  gradient: string;
  ghost1: string;
  ghost2: string;
  badge: string;
  accentText: string;
  divider: string;
  deckChip: string;
  btn: string;
  glow: string;
  dot: string;
  icon: string;
};

const colorConfigs: Record<StackColor, ColorConfig> = {
  // Tier 1 — deepest (near black)
  violet: {
    gradient: "from-[#0a0a0b] via-[#111113] to-[#0a0a0b]",
    ghost1: "bg-[#1c1c1f]/70 border border-white/[0.06]",
    ghost2: "bg-[#141416]/50 border border-white/[0.04]",
    badge: "bg-white/[0.07] text-zinc-300 border-white/[0.10]",
    accentText: "text-zinc-400",
    divider: "border-white/[0.07]",
    deckChip: "bg-white/[0.05] border border-white/[0.08] text-zinc-300",
    btn: "bg-white/[0.08] hover:bg-white/[0.13] text-white border border-white/[0.14] hover:border-white/[0.22]",
    glow: "hover:shadow-black/50",
    dot: "bg-zinc-500",
    icon: "text-zinc-500",
  },
  // Tier 2 — dark zinc
  blue: {
    gradient: "from-zinc-900 via-zinc-800 to-zinc-900",
    ghost1: "bg-zinc-700/60 border border-white/[0.07]",
    ghost2: "bg-zinc-800/40 border border-white/[0.04]",
    badge: "bg-white/[0.08] text-zinc-300 border-white/[0.11]",
    accentText: "text-zinc-400",
    divider: "border-white/[0.08]",
    deckChip: "bg-white/[0.06] border border-white/[0.09] text-zinc-300",
    btn: "bg-white/[0.09] hover:bg-white/[0.14] text-white border border-white/[0.15] hover:border-white/[0.24]",
    glow: "hover:shadow-black/40",
    dot: "bg-zinc-400",
    icon: "text-zinc-400",
  },
  // Tier 3 — medium-dark zinc (most legible)
  emerald: {
    gradient: "from-zinc-800 via-zinc-700 to-zinc-800",
    ghost1: "bg-zinc-600/50 border border-white/[0.09]",
    ghost2: "bg-zinc-700/35 border border-white/[0.05]",
    badge: "bg-white/[0.10] text-zinc-200 border-white/[0.13]",
    accentText: "text-zinc-300",
    divider: "border-white/[0.10]",
    deckChip: "bg-white/[0.08] border border-white/[0.11] text-zinc-200",
    btn: "bg-white/[0.10] hover:bg-white/[0.16] text-white border border-white/[0.17] hover:border-white/[0.26]",
    glow: "hover:shadow-black/35",
    dot: "bg-zinc-300",
    icon: "text-zinc-300",
  },
  // Tier 4 — deep with warm neutral undertone
  amber: {
    gradient: "from-stone-900 via-stone-800 to-zinc-900",
    ghost1: "bg-stone-700/55 border border-white/[0.07]",
    ghost2: "bg-stone-800/35 border border-white/[0.04]",
    badge: "bg-white/[0.08] text-stone-300 border-white/[0.10]",
    accentText: "text-stone-400",
    divider: "border-white/[0.07]",
    deckChip: "bg-white/[0.06] border border-white/[0.09] text-stone-300",
    btn: "bg-white/[0.08] hover:bg-white/[0.13] text-white border border-white/[0.14] hover:border-white/[0.22]",
    glow: "hover:shadow-black/40",
    dot: "bg-stone-400",
    icon: "text-stone-400",
  },
  // Tier 5 — cool slate-dark
  rose: {
    gradient: "from-slate-900 via-slate-800 to-zinc-900",
    ghost1: "bg-slate-700/55 border border-white/[0.07]",
    ghost2: "bg-slate-800/35 border border-white/[0.04]",
    badge: "bg-white/[0.08] text-slate-300 border-white/[0.10]",
    accentText: "text-slate-400",
    divider: "border-white/[0.07]",
    deckChip: "bg-white/[0.06] border border-white/[0.09] text-slate-300",
    btn: "bg-white/[0.08] hover:bg-white/[0.13] text-white border border-white/[0.14] hover:border-white/[0.22]",
    glow: "hover:shadow-black/40",
    dot: "bg-slate-400",
    icon: "text-slate-400",
  },
};

interface StackCardProps {
  stack: DeckStack;
}

export default function StackCard({ stack }: StackCardProps) {
  const c = colorConfigs[stack.color];
  const allDecks = getAllDecksSync();
  const decksInStack = allDecks
    .filter((d) => stack.deckIds.includes(d.id))
    .sort(compareDecksNewestFirst);
  const totalCards = decksInStack.reduce((sum, d) => sum + (getDeckCardCount(d) ?? 0), 0);

  return (
    // Outer wrapper: extra padding so the ghost cards have room
    <div className="group relative pt-4 px-3 pb-3">
      {/* Ghost card 2 – farthest back */}
      <div
        className={`absolute inset-x-3 top-4 bottom-3 rounded-2xl ${c.ghost2} transition-all duration-500 ease-out
          rotate-[-2.5deg] translate-y-1
          group-hover:rotate-[-6deg] group-hover:translate-y-[-4px] group-hover:translate-x-[-6px]`}
      />
      {/* Ghost card 1 – middle */}
      <div
        className={`absolute inset-x-3 top-4 bottom-3 rounded-2xl ${c.ghost1} transition-all duration-500 ease-out
          rotate-[-1.2deg] translate-y-0.5
          group-hover:rotate-[-3deg] group-hover:translate-y-[-2px] group-hover:translate-x-[-3px]`}
      />

      {/* Main card */}
      <Link to={`/stack/${stack.id}`} className="block">
        <div
          className={`relative rounded-2xl bg-gradient-to-br ${c.gradient} p-7 shadow-xl transition-all duration-500
            ${c.glow} hover:shadow-2xl hover:-translate-y-1`}
        >
          {/* Subtle noise / texture overlay */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.03] [background-image:url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.85%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%2F%3E%3C%2FSvg%3E')]" />

          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <Badge className={`${c.badge} border font-semibold text-xs uppercase tracking-widest px-2.5 py-1`}>
              {stack.discipline}
            </Badge>
            <div className="flex items-center gap-1.5 text-white/50 text-xs font-medium bg-white/5 px-2.5 py-1 rounded-md">
              <Layers className="w-3.5 h-3.5" />
              <span>{stack.deckIds.length} Decks</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white leading-tight mb-1.5 pr-4">
            {stack.title}
          </h3>
          <p className={`text-xs font-medium mb-3 ${c.accentText} tracking-wide`}>
            {stack.subtitle}
          </p>

          {/* Divider */}
          <div className={`border-t ${c.divider} mb-4`} />

          {/* Description */}
          <p className="text-sm text-white/60 leading-relaxed mb-5 line-clamp-2">
            {stack.description}
          </p>

          {/* Deck list */}
          <div className="flex flex-col gap-2 mb-6">
            {decksInStack.map((deck) => (
              <div key={deck.id} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${c.deckChip} transition-colors`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                <span className="truncate flex-1">{deck.title}</span>
                <span className="text-white/30 flex-shrink-0 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {getDeckCardCount(deck) ?? "–"}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/40 text-xs">
              <GraduationCap className="w-4 h-4" />
              <span>{totalCards > 0 ? `${totalCards} Karten gesamt` : `${stack.totalCards} Karten`}</span>
            </div>
            <div className={`flex items-center gap-1.5 text-sm font-semibold rounded-lg px-4 py-1.5 transition-all ${c.btn}`}>
              <span>Erkunden</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
