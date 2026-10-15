import { useState, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  User,
  Tag,
  Signal,
  GraduationCap,
  AlignLeft,
  ChevronRight,
  Sparkles,
  FlipHorizontal,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowLeft,
  FileText,
  Layers,
  Plus,
  Trash2,
  LayoutGrid,
  SplitSquareHorizontal,
  Download,
  Mail,
  Copy,
  Check,
  FileJson,
} from "lucide-react";
import type { FlashCard } from "@/converters/types";
import { createMarkup } from "@/components/flashcard/flashcard-utils";
import { mockStacks, mockDecks, type DeckCreationTag } from "@/data/decks";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

import {
  useDeckCreation,
  COMPLEXITY_OPTIONS,
  type Complexity,
  LEVEL_OPTIONS,
  CREATION_TAG_OPTIONS,
  type BelongingMode,
  type Subset,
  slugifyFileName,
} from "@/hooks/useDeckCreation";

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------

interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; id?: string }
function Toggle({ checked, onChange, id }: ToggleProps) {
  return (
    <button id={id} role="switch" aria-checked={checked} type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${checked ? "bg-primary" : "bg-zinc-200"}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Field
// ---------------------------------------------------------------------------

interface FieldProps { label: string; icon: React.ReactNode; htmlFor: string; hint?: string; children: React.ReactNode }
function Field({ label, icon, htmlFor, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
        <span className="p-1 rounded-md" style={{ background: "rgba(0,0,0,0.04)" }}>{icon}</span>
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section label
// ---------------------------------------------------------------------------

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 -mb-2">
      <div className="p-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.04)" }}>{icon}</div>
      <span className="text-xs font-semibold uppercase tracking-widest text-foreground/50">{children}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card preview item
// ---------------------------------------------------------------------------

interface CardPreviewItemProps { card: FlashCard; index: number; badgeLabel?: string }
function CardPreviewItem({ card, index, badgeLabel }: CardPreviewItemProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border transition-all duration-200 overflow-hidden"
      style={{ background: "rgba(250,250,251,0.97)", borderColor: "rgba(228,228,231,0.9)" }}>
      <button type="button" onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50/80 transition-colors">
        <span className="shrink-0 text-[10px] font-bold text-muted-foreground/50 bg-muted/40 rounded-md px-1.5 py-0.5 mt-0.5 tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        {badgeLabel && (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider rounded-md px-1.5 py-0.5 mt-0.5 bg-primary/8 text-primary/80">
            {badgeLabel}
          </span>
        )}
        <span className="flex-1 text-sm font-medium text-foreground/80 line-clamp-2 leading-snug"
          dangerouslySetInnerHTML={createMarkup(card.front)} />
        <span className="shrink-0 ml-1 mt-0.5 text-muted-foreground/40">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border/40 bg-muted/10">
          <div className="flex items-center gap-1.5 mb-2">
            <FlipHorizontal className="w-3 h-3 text-primary/60" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/50">Back</span>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={createMarkup(card.back)} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Belonging mode button
// ---------------------------------------------------------------------------

interface ModeButtonProps { active: boolean; icon: React.ReactNode; label: string; description: string; onClick: () => void }
function ModeButton({ active, icon, label, description, onClick }: ModeButtonProps) {
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all duration-200 ${
        active ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border/50 bg-white/60 hover:bg-zinc-50 hover:border-border"
      }`}>
      <div className={`p-1.5 rounded-lg mb-0.5 ${active ? "bg-primary/10" : "bg-muted/30"}`}>
        <span className={active ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      </div>
      <span className={`text-xs font-semibold leading-tight ${active ? "text-primary" : "text-foreground/70"}`}>{label}</span>
      <span className="text-[10px] text-muted-foreground/60 leading-snug">{description}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Subset row
// ---------------------------------------------------------------------------

interface SubsetRowProps { subset: Subset; totalCards: number; onChange: (id: string, f: "name" | "cardCount", v: string | number) => void; onRemove: (id: string) => void; canRemove: boolean; sectionIndex: number }
function SubsetRow({ subset, totalCards, onChange, onRemove, canRemove, sectionIndex }: SubsetRowProps) {
  const COLORS = ["rgba(0,0,0,0.25)","rgba(0,0,0,0.18)","rgba(0,0,0,0.30)","rgba(0,0,0,0.20)","rgba(0,0,0,0.22)"];
  return (
    <div className="flex items-center gap-2">
      <div className="w-1 h-10 rounded-full shrink-0" style={{ background: COLORS[sectionIndex % COLORS.length] }} />
      <Input value={subset.name} onChange={(e) => onChange(subset.id, "name", e.target.value)}
        placeholder={`Teilbereich ${sectionIndex + 1}`} className="flex-1 h-9 rounded-xl text-sm"
        style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(228,228,231,0.9)" }} />
      <div className="flex items-center gap-1.5 shrink-0">
        <input type="number" min={1} max={totalCards} value={subset.cardCount}
          onChange={(e) => onChange(subset.id, "cardCount", Math.max(1, parseInt(e.target.value) || 1))}
          className="w-16 h-9 rounded-xl border px-2 text-center text-sm font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(228,228,231,0.9)" }} />
        <span className="text-[10px] text-muted-foreground/50 font-medium">Karten</span>
      </div>
      {canRemove && (
        <button type="button" onClick={() => onRemove(subset.id)}
          className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}


export default function CreateDeck() {
  const location = useLocation();

  const { cards: rawCards = [], suggestedTitle = "", style = "" } = (location.state as any) ?? {};

  const {
    cards,
    title,
    setTitle,
    topic,
    setTopic,
    author,
    setAuthor,
    complexity,
    setComplexity,
    level,
    setLevel,
    creationTag,
    setCreationTag,
    description,
    setDescription,
    belongingMode,
    setBelongingMode,
    selectedStackId,
    setSelectedStackId,
    newStackName,
    setNewStackName,
    subsetsEnabled,
    setSubsetsEnabled,
    subsets,
    setSubsets,
    subsetTotal,
    subsetOverflow,
    subsetUnderflow,
    handleSubsetChange,
    addSubset,
    removeSubset,
    showAllCards,
    setShowAllCards,
    previewCards,
    cardSectionLabel,
    submitted,
    exportJson,
    manifestExportJson,
    mergedIndexJson,
    exportFileName,
    copiedSnippet,
    isValid,
    handleSubmit,
    downloadDeckJson,
    downloadMergedIndexJson,
    copyManifestSnippet,
  } = useDeckCreation({ rawCards, suggestedTitle, style });

  // ── Empty state ───────────────────────────────────────────────────────────
  if (cards.length === 0) {
    return (
      <div className="relative container mx-auto py-24 px-4 max-w-xl text-center flex flex-col items-center gap-6">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-grid" />
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.04)" }}>
          <FileText className="w-9 h-9 text-foreground/30" />
        </div>
        <div>
          <Badge variant="outline" className="w-fit flex items-center gap-1 border-primary/20 bg-primary/5 text-primary mb-4 mx-auto">
            <Sparkles className="w-3 h-3" />
            <span>Kein Datensatz geladen</span>
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Keine Karten vorhanden</h1>
          <p className="text-muted-foreground max-w-sm">
            Konvertiere zuerst ein Anki-Export, dann gelangst du mit dem{" "}
            <span className="font-medium text-foreground">Erstellen</span>-Button hierher.
          </p>
        </div>
        <Button asChild size="lg" className="rounded-xl gap-2">
          <Link to="/configure">
            <ArrowLeft className="w-4 h-4" />
            Zum Konverter
          </Link>
        </Button>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (submitted) {
    const manifestEntrySnippet = manifestExportJson?.decks?.[0]
      ? JSON.stringify(manifestExportJson.decks[0], null, 2)
      : "";

    return (
      <div className="relative container mx-auto py-16 px-4 max-w-2xl text-center flex flex-col items-center gap-6">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-grid" />
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-zinc-100 border border-zinc-200">
          <CheckCircle2 className="w-8 h-8 text-zinc-800" />
        </div>
        <div>
          <Badge variant="outline" className="w-fit flex items-center gap-1 border-zinc-300 bg-zinc-100 text-zinc-800 mb-3 mx-auto text-xs">
            <Sparkles className="w-3 h-3" />
            <span>JSON Paket bereit</span>
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-foreground">Deck-Export abgeschlossen</h1>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            <span className="font-semibold text-foreground">{title}</span> wurde erfolgreich als strukturierte JSON-Datei kompiliert mit{" "}
            {cards.length} Karte{cards.length !== 1 ? "n" : ""}
            {subsetsEnabled && subsets.length > 1 ? ` in ${subsets.length} Teilbereichen` : ""}.
          </p>
        </div>

        {/* Action Buttons Header */}
        <div className="flex flex-wrap gap-3 justify-center w-full pt-1">
          <Button className="rounded-xl gap-2 font-semibold text-xs h-10 px-5 shadow-2xs" onClick={downloadDeckJson}>
            <Download className="w-4 h-4" /> 1. Deck JSON herunterladen ({exportFileName})
          </Button>
          {mergedIndexJson && (
            <Button variant="outline" className="rounded-xl gap-2 text-xs h-10 bg-background" onClick={downloadMergedIndexJson}>
              <Download className="w-4 h-4" /> 2. Aktualisierte index.json herunterladen
            </Button>
          )}
        </div>

        {/* Code snippet for index.json */}
        <div className="w-full text-left rounded-xl border border-zinc-200 bg-card overflow-hidden shadow-2xs">
          <div className="bg-muted/50 px-4 py-2.5 border-b flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <FileJson className="w-3.5 h-3.5 text-zinc-600" />
              <span>Manifest-Eintrag für <code className="font-mono text-zinc-900">public/data/decks/index.json</code></span>
            </div>
            <Button variant="ghost" size="sm" onClick={copyManifestSnippet} className="h-7 text-xs gap-1.5 px-2 text-muted-foreground hover:text-foreground">
              {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSnippet ? "Kopiert!" : "Snippet kopieren"}
            </Button>
          </div>
          <div className="p-4 bg-background">
            <pre className="font-mono text-[11px] leading-relaxed whitespace-pre overflow-x-auto text-zinc-800">
              {manifestEntrySnippet}
            </pre>
          </div>
        </div>

        {/* Deployment & E-Mail instructions */}
        <div className="w-full text-left p-4 rounded-xl border border-zinc-200 bg-zinc-50/90 text-xs text-zinc-700 leading-relaxed space-y-2.5 shadow-2xs">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
            <Mail className="w-4 h-4 text-zinc-700 shrink-0" />
            <span>So wird das Deck auf der Plattform eingebunden:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-zinc-600">
            <li>
              Speichere die gedownloadete <code className="font-mono text-zinc-900 font-semibold bg-zinc-200/60 px-1 py-0.5 rounded">{exportFileName}</code> im Ordner <code className="font-mono text-zinc-900 font-semibold bg-zinc-200/60 px-1 py-0.5 rounded">public/data/decks/</code> ab.
            </li>
            <li>
              Füge das oben gezeigte JSON-Snippet in <code className="font-mono text-zinc-900 font-semibold bg-zinc-200/60 px-1 py-0.5 rounded">public/data/decks/index.json</code> unter <code className="font-mono text-zinc-900 font-semibold bg-zinc-200/60 px-1 py-0.5 rounded">"decks"</code> ein (oder verwende die gedownloadete <code className="font-mono text-zinc-900 font-semibold bg-zinc-200/60 px-1 py-0.5 rounded">index.json</code>).
            </li>
            <li>
              <strong>Für Nutzer ohne Repository-Zugriff:</strong> Sende beide Dateien per E-Mail an den Webhost / Betreiber der Plattform.
            </li>
          </ol>
        </div>

        <div className="flex gap-3 justify-center w-full pt-2">
          <Button variant="outline" asChild className="rounded-xl gap-2 text-xs h-9">
            <Link to="/"><BookOpen className="w-4 h-4" /> Decks durchsuchen</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-xl gap-2 text-xs h-9">
            <Link to="/configure"><ArrowLeft className="w-4 h-4" /> Zum Deck-Converter</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="relative container mx-auto py-10 px-4 md:px-6 max-w-6xl">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-grid" />
      {style && <style>{style}</style>}

      {/* Breadcrumb */}
      <div className="mb-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/configure">Konvertieren</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage className="font-medium">Deck erstellen</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="mb-10">
        <Badge variant="outline" className="w-fit flex items-center gap-1.5 border-primary/20 bg-primary/5 text-primary mb-3">
          <Sparkles className="w-3 h-3" />
          <span>{cards.length} Karten importiert</span>
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Neues Deck erstellen</h1>
        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
          Beschreibe dein Deck, ordne es in die Bibliothek ein und unterteile es optional in thematische Teilbereiche.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* 1. Metadata */}
            <div className="rounded-2xl border p-6 flex flex-col gap-6"
              style={{ background: "rgba(250,250,251,0.97)", borderColor: "rgba(228,228,231,0.9)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <SectionLabel icon={<FileText className="w-4 h-4 text-primary" />}>Metadaten</SectionLabel>

              <Field label="Titel" icon={<BookOpen className="w-3.5 h-3.5 text-primary" />} htmlFor="deck-title" hint="Ein prägnanter, beschreibender Name.">
                <Input id="deck-title" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Analysis Grundlagen" required className="h-10 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(228,228,231,0.9)" }} />
              </Field>

              <Field label="Thema" icon={<Tag className="w-3.5 h-3.5 text-primary" />} htmlFor="deck-topic" hint="Das Fachgebiet dieses Datensatzes.">
                <Input id="deck-topic" value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="z.B. Mathematik, Philosophie, Informatik" required className="h-10 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(228,228,231,0.9)" }} />
              </Field>

              <Field label="Autor" icon={<User className="w-3.5 h-3.5 text-primary" />} htmlFor="deck-author">
                <Input id="deck-author" value={author} onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Dein Name oder Pseudonym" required className="h-10 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(228,228,231,0.9)" }} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Schwierigkeitsgrad" icon={<Signal className="w-3.5 h-3.5 text-primary" />} htmlFor="deck-complexity">
                  <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: "rgba(228,228,231,0.9)" }}>
                    {COMPLEXITY_OPTIONS.map((opt) => (
                      <button key={opt} type="button" onClick={() => setComplexity(opt)}
                        className={`flex-1 py-2 text-xs font-semibold transition-colors ${complexity === opt ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground hover:bg-zinc-50"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Stufe" icon={<GraduationCap className="w-3.5 h-3.5 text-primary" />} htmlFor="deck-level">
                  <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: "rgba(228,228,231,0.9)" }}>
                    {LEVEL_OPTIONS.map((opt) => (
                      <button key={opt} type="button" onClick={() => setLevel(opt)}
                        className={`flex-1 py-2 text-xs font-semibold transition-colors ${level === opt ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground hover:bg-zinc-50"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <Field label="Erstellungsart" icon={<Sparkles className="w-3.5 h-3.5 text-primary" />} htmlFor="deck-creation-tag" hint="Kennzeichnet, wie dieses Deck entstanden ist.">
                <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: "rgba(228,228,231,0.9)" }}>
                  {CREATION_TAG_OPTIONS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setCreationTag(opt)}
                      className={`flex-1 py-2 text-xs font-semibold transition-colors ${creationTag === opt ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground hover:bg-zinc-50"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Beschreibung" icon={<AlignLeft className="w-3.5 h-3.5 text-primary" />} htmlFor="deck-description" hint="Hilf anderen zu verstehen, was dieses Deck abdeckt.">
                <textarea id="deck-description" value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kurze Zusammenfassung des Inhalts, der Lernziele…" required rows={4}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                  style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(228,228,231,0.9)" }} />
              </Field>
            </div>

            {/* 2. Belonging */}
            <div className="rounded-2xl border p-6 flex flex-col gap-5"
              style={{ background: "rgba(250,250,251,0.97)", borderColor: "rgba(228,228,231,0.9)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <SectionLabel icon={<Layers className="w-4 h-4 text-primary" />}>Zugehörigkeit</SectionLabel>
              <p className="text-xs text-muted-foreground -mt-3 leading-relaxed">
                Wähle, ob das Deck eigenständig ist, einem bestehenden Stack angehört oder einen neuen Stack bildet.
              </p>

              <div className="flex gap-3">
                <ModeButton active={belongingMode === "standalone"} icon={<LayoutGrid className="w-4 h-4" />}
                  label="Eigenständig" description="Einzelnes Deck in der Bibliothek" onClick={() => setBelongingMode("standalone")} />
                <ModeButton active={belongingMode === "existing-stack"} icon={<Layers className="w-4 h-4" />}
                  label="Bestehender Stack" description="Zu einem vorhandenen Stack hinzufügen" onClick={() => setBelongingMode("existing-stack")} />
                <ModeButton active={belongingMode === "new-stack"} icon={<Plus className="w-4 h-4" />}
                  label="Neuer Stack" description="Einen neuen thematischen Stack anlegen" onClick={() => setBelongingMode("new-stack")} />
              </div>

              {belongingMode === "existing-stack" && (
                <div className="flex flex-col gap-2 pt-1">
                  <label className="text-xs font-semibold text-foreground/70">Stack auswählen</label>
                  <div className="flex flex-col gap-2">
                    {mockStacks.map((stack) => (
                      <button key={stack.id} type="button" onClick={() => setSelectedStackId(stack.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                          selectedStackId === stack.id ? "border-primary/40 bg-primary/5" : "border-border/50 bg-white/60 hover:bg-zinc-50 hover:border-border"
                        }`}>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${selectedStackId === stack.id ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${selectedStackId === stack.id ? "text-primary" : "text-foreground/80"}`}>{stack.title}</p>
                          <p className="text-xs text-muted-foreground/70 truncate">{stack.subtitle}</p>
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground/50 shrink-0 bg-muted/30 px-2 py-0.5 rounded-md">
                          {stack.deckIds.length} Decks
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {belongingMode === "new-stack" && (
                <div className="flex flex-col gap-2 pt-1">
                  <label htmlFor="new-stack-name" className="text-xs font-semibold text-foreground/70">Name des neuen Stacks</label>
                  <Input id="new-stack-name" value={newStackName} onChange={(e) => setNewStackName(e.target.value)}
                    placeholder="z.B. Mathematische Grundlagen" required={belongingMode === "new-stack"} className="h-10 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(228,228,231,0.9)" }} />
                </div>
              )}
            </div>

            {/* 3. Subsets */}
            <div className="rounded-2xl border p-6 flex flex-col gap-5"
              style={{ background: "rgba(250,250,251,0.97)", borderColor: "rgba(228,228,231,0.9)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <SectionLabel icon={<SplitSquareHorizontal className="w-4 h-4 text-primary" />}>Teilbereiche</SectionLabel>

              <div className="flex items-start justify-between gap-4 -mt-2">
                <div className="flex flex-col gap-1 max-w-md">
                  <span className="text-sm font-medium text-foreground">In Teilbereiche aufteilen</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Unterteile das Deck in thematische Abschnitte. Die Karten werden der Reihenfolge nach zugeordnet.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3 pt-0.5">
                  <span className="text-xs font-medium text-muted-foreground hidden sm:inline">{subsetsEnabled ? "An" : "Aus"}</span>
                  <Toggle id="toggle-subsets" checked={subsetsEnabled}
                    onChange={(v) => { setSubsetsEnabled(v); if (v && subsets.length === 0) setSubsets([{ id: "s1", name: "", cardCount: cards.length }]); }} />
                </div>
              </div>

              {subsetsEnabled && (
                <div className="flex flex-col gap-3">
                  {subsets.map((s, i) => (
                    <SubsetRow key={s.id} subset={s} totalCards={cards.length} onChange={handleSubsetChange}
                      onRemove={removeSubset} canRemove={subsets.length > 1} sectionIndex={i} />
                  ))}
                  <button type="button" onClick={addSubset}
                    className="flex items-center gap-2 py-2 text-xs font-semibold text-primary/70 hover:text-primary rounded-xl border border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all justify-center">
                    <Plus className="w-3.5 h-3.5" />Teilbereich hinzufügen
                  </button>
                  <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium ${
                    subsetOverflow ? "border-red-200 bg-red-50 text-red-600" : subsetUnderflow ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}>
                    <span>{subsetTotal} / {cards.length} Karten zugeordnet</span>
                    {subsetOverflow && <span>Zu viele — bitte reduzieren.</span>}
                    {subsetUnderflow && <span>{cards.length - subsetTotal} Karte{cards.length - subsetTotal !== 1 ? "n" : ""} noch nicht zugeordnet.</span>}
                    {!subsetOverflow && !subsetUnderflow && <span>Alle Karten zugeordnet ✓</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" disabled={!isValid} size="lg"
              className="w-full h-12 rounded-xl shadow-2xs hover:shadow-xs transition-all gap-2 font-semibold text-sm">
              <Download className="w-4 h-4" /> JSON Paket exportieren & herunterladen
            </Button>
          </div>

          {/* ── Right column: Live preview ─────────────────────────────── */}
          <div className="lg:col-span-5 flex flex-col gap-5 lg:sticky lg:top-24">

            {/* Deck preview card */}
            <div className="rounded-2xl border overflow-hidden"
              style={{ background: "rgba(250,250,251,0.97)", borderColor: "rgba(228,228,231,0.9)", boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)" }}>
              <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.04) 100%)" }} />
              <div className="px-6 pt-5 pb-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs uppercase tracking-wider font-medium px-2.5 py-1">
                    {topic || "Thema"}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground/60 flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-md">
                    <BookOpen className="w-3.5 h-3.5" />{cards.length}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground/90 leading-snug mb-1.5">
                    {title || <span className="text-muted-foreground/40 font-normal italic">Titel des Decks…</span>}
                  </h2>
                  <p className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-3 min-h-[3.5rem]">
                    {description || <span className="italic text-muted-foreground/30">Beschreibung erscheint hier…</span>}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-border/40 pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="font-medium truncate max-w-[130px]">{author || "Autor"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground/60">
                    {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/30 text-foreground/70 text-xs font-medium">
                    <Signal className="w-3.5 h-3.5" />{complexity}
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/30 text-foreground/70 text-xs font-medium">
                    <GraduationCap className="w-3.5 h-3.5" />{level}
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/5 text-primary text-xs font-medium border border-primary/15">
                    <Sparkles className="w-3.5 h-3.5" />{creationTag}
                  </span>
                  {belongingMode === "existing-stack" && selectedStackId && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/5 text-primary text-xs font-medium border border-primary/15">
                      <Layers className="w-3.5 h-3.5" />{mockStacks.find((s) => s.id === selectedStackId)?.title ?? "Stack"}
                    </span>
                  )}
                  {belongingMode === "new-stack" && newStackName && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/5 text-primary text-xs font-medium border border-primary/15">
                      <Plus className="w-3.5 h-3.5" />{newStackName}
                    </span>
                  )}
                </div>
                {/* Subset pills */}
                {subsetsEnabled && subsets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 border-t border-border/40 pt-3">
                    {subsets.map((s, i) => {
                      const BG = ["rgba(0,0,0,0.05)","rgba(0,0,0,0.05)","rgba(0,0,0,0.05)","rgba(0,0,0,0.05)","rgba(0,0,0,0.05)"];
                      const TX = ["text-foreground/60","text-foreground/60","text-foreground/60","text-foreground/60","text-foreground/60"];
                      return (
                        <span key={s.id} className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${TX[i % TX.length]}`}
                          style={{ background: BG[i % BG.length] }}>
                          {s.name.trim() || `Teilbereich ${i + 1}`} · {s.cardCount}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Card preview list */}
            <div className="rounded-2xl border"
              style={{ background: "rgba(250,250,251,0.97)", borderColor: "rgba(228,228,231,0.9)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-border/40">
                <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.04)" }}>
                    <FlipHorizontal className="w-3.5 h-3.5 text-foreground/50" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-foreground/50">Kartenvorschau</span>
                </div>
                <span className="text-xs text-muted-foreground/60 font-medium">{cards.length} gesamt</span>
              </div>
              <div className="p-4 flex flex-col gap-2 max-h-80 overflow-y-auto">
                {previewCards.map((card, i) => (
                  <CardPreviewItem key={i} card={card} index={i} badgeLabel={subsetsEnabled ? cardSectionLabel[i] : undefined} />
                ))}
              </div>
              {cards.length > 5 && (
                <div className="px-4 pb-4">
                  <button type="button" onClick={() => setShowAllCards((v) => !v)}
                    className="w-full py-2 text-xs font-semibold text-primary/70 hover:text-primary rounded-xl border border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all">
                    {showAllCards ? "Weniger anzeigen" : `Alle ${cards.length} Karten anzeigen`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

