import { Lock, Info } from "lucide-react";

/**
 * Informational banner displayed on all pages.
 * Tells users that every download set is available as an Anki package
 * (.apkg) and highlights local, private on-device processing.
 */
export default function AnkiBanner() {
  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-zinc-700 mb-8 shadow-2xs">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-zinc-200/80 text-zinc-700">
          <Info className="w-3.5 h-3.5" />
        </span>
        <p className="leading-relaxed">
          <span className="font-semibold text-zinc-900">Open Source & Akademisch:</span> Alle Datensätze sind als Anki-Pakete (.apkg) inklusive KaTeX-Formeln und Notetyp-Styles verfügbar.
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <Lock className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
        <span>100% Client-Side Processing</span>
      </div>
    </div>
  );
}
