import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Link, useNavigate } from "react-router-dom";
import {
  Wand2,
  Download,
  Upload,
  Check,
  RotateCcw,
  Layers,
  Sparkles,
  ShieldCheck,
  Clock,
  Eye,
  FileArchive,
  ArrowRight,
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Replace,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { decodeApkgRaw } from "@/converters/apkg";
import { createApkgFromAnkiJson } from "@/converters/jsonToApkg";
import { CARD_TEMPLATES, type CardTemplateId } from "@/converters/templates";
import { normalizeMathMarkdown } from "@/utils/mathUtils";
import { KaTeXRenderer } from "@/components/flashcard/KaTeXPreview";
import TurndownService from "turndown";

const _turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

export interface TransformationConfig {
  cleanListBullets: boolean;
  normalizeMath: boolean;
  htmlToMarkdown: boolean;
  stripFieldLabels: boolean;
  normalizeWhitespace: boolean;
  targetTemplate: CardTemplateId;
}

const DEFAULT_CONFIG: TransformationConfig = {
  cleanListBullets: true,
  normalizeMath: true,
  htmlToMarkdown: true,
  stripFieldLabels: true,
  normalizeWhitespace: true,
  targetTemplate: "markdown_basic",
};

/**
 * Transforms legacy Anki note field content into clean modern Markdown.
 */
function transformFieldContent(content: string, config: TransformationConfig): string {
  if (!content || typeof content !== "string") return "";
  let str = content;

  // 1. Convert legacy HTML markup to clean Markdown via Turndown
  if (config.htmlToMarkdown && /<[a-z][\s\S]*?>/i.test(str)) {
    try {
      str = _turndown.turndown(str);
    } catch {
      // Fallback: strip basic tags
      str = str.replace(/<[\/]?pre[^>]*>/gi, "");
      str = str.replace(/<[\/]?span[^>]*>/gi, "");
    }
  }

  // 2. Normalize MathJax and LaTeX expressions
  if (config.normalizeMath) {
    str = normalizeMathMarkdown(str);
    // Fix stray unescaped backslashes in math blocks
    str = str.replace(/\\\\([()[\]])/g, "\\$1");
  }

  // 3. Strip redundant bold field labels baked into the text
  if (config.stripFieldLabels) {
    str = str.replace(/^\s*\*\*?(Vorderseite|Rückseite|Antwort|Front|Back|Question|Frage|Answer)\*\*?:\s*/gim, "");
  }

  // 4. Clean list bullets & indentation (solves the accidental sub-bullet <br> * issue)
  if (config.cleanListBullets) {
    // Strip <br> tags immediately preceding list markers
    str = str.replace(/<br\s*[\/]?[^>]*>[ \t]*(?=[*+-]|\d+\.)/gi, "\n");
    // Strip remaining <br> tags
    str = str.replace(/<br\s*[\/]?[^>]*>/gi, "\n");
    // Strip accidental single-space indentations before list markers
    str = str.replace(/(^|\n) ([*+-]|\d+\.) /g, "$1$2 ");
  }

  // 5. Normalize whitespace
  if (config.normalizeWhitespace) {
    // Strip trailing spaces per line
    str = str.replace(/[ \t]+$/gm, "");
    // Collapse 3+ newlines to standard double newlines
    str = str.replace(/\n{3,}/g, "\n\n");
  }

  return str.trim();
}

interface NoteCardItem {
  id: number;
  deckId: number;
  deckName: string;
  originalFront: string;
  originalBack: string;
  transformedFront: string;
  transformedBack: string;
  flds?: string;
  tags?: string;
  scheduling?: {
    type?: number;
    queue?: number;
    due?: number;
    ivl?: number;
    factor?: number;
    reps?: number;
    lapses?: number;
  };
}

export default function DeckRemaster() {
  const navigate = useNavigate();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [deckRawData, setDeckRawData] = useState<any | null>(null);
  const [isDecompiling, setIsDecompiling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [config, setConfig] = useState<TransformationConfig>(DEFAULT_CONFIG);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"diff" | "preview" | "raw">("diff");

  // Decompile uploaded APKG
  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setSuccessMessage(null);
    setUploadedFile(file);
    setIsDecompiling(true);

    try {
      const buffer = await file.arrayBuffer();
      const rawResult = await decodeApkgRaw(
        buffer,
        "reduced",
        ["front", "back", "extra", "flds", "id", "guid", "mid", "mod", "usn", "tags"],
        { includeScheduling: true, includeDeckPreset: true }
      );

      setDeckRawData(rawResult);
      setSelectedCardIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decompile .apkg file.");
      setDeckRawData(null);
    } finally {
      setIsDecompiling(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { "application/octet-stream": [".apkg"] },
    maxFiles: 1,
  });

  // Extract flattened note entries and apply live transformations
  const noteItems: NoteCardItem[] = useMemo(() => {
    if (!deckRawData?.decks?.byId) return [];

    const items: NoteCardItem[] = [];

    for (const [deckIdStr, rawDeck] of Object.entries(deckRawData.decks.byId as Record<string, any>)) {
      const deckId = Number(deckIdStr);
      const deckName = rawDeck.fullName || rawDeck.name || `Deck ${deckId}`;
      const notes = Array.isArray(rawDeck.notes) ? rawDeck.notes : [];

      for (const note of notes) {
        const origFront = String(note.front || "");
        const origBack = String(note.back || "");

        const transformedFront = transformFieldContent(origFront, config);
        const transformedBack = transformFieldContent(origBack, config);

        const firstCard = Array.isArray(note.cards) && note.cards.length > 0 ? note.cards[0] : null;

        items.push({
          id: Number(note.id),
          deckId,
          deckName,
          originalFront: origFront,
          originalBack: origBack,
          transformedFront,
          transformedBack,
          flds: note.flds,
          tags: note.tags,
          scheduling: firstCard?.scheduling,
        });
      }
    }

    return items;
  }, [deckRawData, config]);

  // Scheduling Statistics
  const schedulingStats = useMemo(() => {
    let newCards = 0;
    let learningCards = 0;
    let reviewCards = 0;
    let suspendedCards = 0;
    let totalReps = 0;

    for (const item of noteItems) {
      const s = item.scheduling;
      if (!s) {
        newCards++;
        continue;
      }
      totalReps += s.reps || 0;
      const q = typeof s.queue === "number" ? s.queue : 0;
      if (q === 0) newCards++;
      else if (q === 1) learningCards++;
      else if (q === 2) reviewCards++;
      else if (q < 0) suspendedCards++;
      else reviewCards++;
    }

    return { newCards, learningCards, reviewCards, suspendedCards, totalReps };
  }, [noteItems]);

  // Filtered note items
  const filteredNoteItems = useMemo(() => {
    if (!searchQuery.trim()) return noteItems;
    const q = searchQuery.toLowerCase();
    return noteItems.filter(
      (item) =>
        item.originalFront.toLowerCase().includes(q) ||
        item.originalBack.toLowerCase().includes(q) ||
        item.transformedFront.toLowerCase().includes(q) ||
        item.transformedBack.toLowerCase().includes(q) ||
        String(item.id).includes(q)
    );
  }, [noteItems, searchQuery]);

  const currentItem = filteredNoteItems[selectedCardIndex] || filteredNoteItems[0] || null;

  // Repack and export to .apkg with preserved scheduling
  const handleExportRemasteredApkg = useCallback(async () => {
    if (!deckRawData || noteItems.length === 0) return;

    setIsExporting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Build updated Anki JSON with transformed front/back
      const transformedJson = JSON.parse(JSON.stringify(deckRawData));

      if (transformedJson.decks?.byId) {
        for (const rawDeck of Object.values(transformedJson.decks.byId as Record<string, any>)) {
          if (Array.isArray(rawDeck.notes)) {
            for (const note of rawDeck.notes) {
              const origFront = String(note.front || "");
              const origBack = String(note.back || "");

              note.front = transformFieldContent(origFront, config);
              note.back = transformFieldContent(origBack, config);

              // Update flds array if present
              if (note.flds) {
                const parts = String(note.flds).split("\x1f");
                if (parts.length >= 2) {
                  parts[0] = note.front;
                  parts[1] = note.back;
                  for (let i = 2; i < parts.length; i++) {
                    parts[i] = transformFieldContent(parts[i], config);
                  }
                  note.flds = parts.join("\x1f");
                }
              }
            }
          }
        }
      }

      const baseName = uploadedFile ? uploadedFile.name.replace(/\.[^.]+$/, "") : "deck";
      const deckTitle = `${baseName} (Remastered)`;

      const blob = await createApkgFromAnkiJson(
        transformedJson,
        deckTitle,
        config.targetTemplate
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}_remastered.apkg`;
      a.click();
      URL.revokeObjectURL(url);

      setSuccessMessage(`Deck successfully remastered and exported with 100% scheduling intact!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to repack and export .apkg file.");
    } finally {
      setIsExporting(false);
    }
  }, [deckRawData, noteItems, config, uploadedFile]);

  // Send cards to Schedae Workspace
  const handleSendToWorkspace = useCallback(() => {
    if (noteItems.length === 0) return;

    const cardsForWorkspace = noteItems.map((n) => ({
      front: n.transformedFront,
      back: n.transformedBack,
    }));

    const batch = [
      {
        id: Date.now().toString(),
        timestamp: Date.now(),
        name: uploadedFile ? uploadedFile.name.replace(/\.[^.]+$/, "") : "Remastered Batch",
        cards: cardsForWorkspace,
      },
    ];

    localStorage.setItem("schedae-workspace-builder-batches", JSON.stringify(batch));
    localStorage.setItem("json-apkg-builder-batches", JSON.stringify(batch));
    navigate("/");
  }, [noteItems, uploadedFile, navigate]);

  return (
    <div className="relative min-h-[calc(100vh-3rem)] w-full bg-background flex flex-col pt-4 pb-8 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col gap-3 mb-5 shrink-0">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground">
                Deck Transformation
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Replace className="w-6 h-6 text-zinc-800" />
              <span>Transform and Update</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl">
              Decompile legacy <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">.apkg</code> decks, sanitize broken formatting, modernize list bullets and math syntax, and upgrade card templates without losing your scheduling history.
            </p>
          </div>

          {deckRawData && (
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeckRawData(null);
                  setUploadedFile(null);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="h-8 text-xs gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> New Deck
              </Button>
              <Button
                onClick={handleExportRemasteredApkg}
                disabled={isExporting}
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                {isExporting ? "Repacking..." : "Export Remastered .apkg"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Upload Dropzone (When no deck loaded) */}
      {!deckRawData ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div
            {...getRootProps()}
            className={`w-full max-w-2xl border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-zinc-300 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mb-4 text-zinc-700 shadow-2xs">
              {isDecompiling ? (
                <Sparkles className="w-7 h-7 animate-spin text-zinc-900" />
              ) : (
                <FileArchive className="w-7 h-7" />
              )}
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              {isDecompiling ? "Decompiling Anki Package..." : "Drop your .apkg file here"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mb-4">
              Select or drop an existing Anki deck. The deck will be decompiled 100% locally in your browser. All note metadata, tags, and scheduling history are preserved.
            </p>
            <Button size="sm" variant="outline" className="text-xs pointer-events-none">
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Select .apkg from Computer
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mt-8">
            <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
              <div className="flex items-center gap-2 text-zinc-900 font-semibold text-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Scheduling Safe</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Intervals, ease factors, repetition counts, and due dates are preserved untouched in the SQLite database.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
              <div className="flex items-center gap-2 text-zinc-900 font-semibold text-xs mb-1">
                <Sparkles className="w-4 h-4 text-zinc-800" />
                <span>Fix Formatting</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Removes stray <code>&lt;br&gt; *</code> artifacts, cleans single-space indentations, and normalizes LaTeX math.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
              <div className="flex items-center gap-2 text-zinc-900 font-semibold text-xs mb-1">
                <Layers className="w-4 h-4 text-zinc-800" />
                <span>Modern Templates</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Upgrades cards to Schedae's responsive KaTeX and Markdown templates with dark mode support.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Workspace when deck is loaded */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 min-h-0">
          {/* Left Column: Deck Info & Transformation Settings */}
          <div className="flex flex-col gap-4">
            {/* Deck Summary Card */}
            <Card className="rounded-xl border shadow-2xs overflow-hidden">
              <div className="bg-muted/40 px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileArchive className="w-4 h-4 text-zinc-800" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Source Deck
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Scheduling Safe
                </Badge>
              </div>

              <CardContent className="p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-foreground truncate">
                    {uploadedFile?.name || "Uploaded Deck"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {noteItems.length} Notes &bull; {deckRawData?.summary?.cardCount || noteItems.length} Cards
                  </p>
                </div>

                {/* Scheduling Pill Breakdown */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <span className="text-[11px] text-muted-foreground block">Review Cards</span>
                    <span className="font-semibold text-foreground">{schedulingStats.reviewCards}</span>
                  </div>
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <span className="text-[11px] text-muted-foreground block">Learning / New</span>
                    <span className="font-semibold text-foreground">
                      {schedulingStats.learningCards + schedulingStats.newCards}
                    </span>
                  </div>
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <span className="text-[11px] text-muted-foreground block">Total Repetitions</span>
                    <span className="font-semibold text-foreground">{schedulingStats.totalReps}</span>
                  </div>
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <span className="text-[11px] text-muted-foreground block">Suspended</span>
                    <span className="font-semibold text-foreground">{schedulingStats.suspendedCards}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transformation Rules Card */}
            <Card className="rounded-xl border shadow-2xs flex-1 flex flex-col">
              <div className="bg-muted/40 px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-zinc-800" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Transformations
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfig(DEFAULT_CONFIG)}
                  className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Reset Defaults
                </Button>
              </div>

              <CardContent className="p-4 space-y-4 flex-1">
                {/* Target Template */}
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">
                    Target Card Template
                  </label>
                  <select
                    value={config.targetTemplate}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        targetTemplate: e.target.value as CardTemplateId,
                      }))
                    }
                    className="w-full text-xs bg-background border rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-ring"
                  >
                    <option value="markdown_basic">Markdown Basic (KaTeX + Inter font)</option>
                    <option value="modern_light">Modern Clean (Light)</option>
                    <option value="modern_dark">Modern Dark</option>
                    <option value="default">Basic (Anki Default)</option>
                  </select>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-2 border-t">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.cleanListBullets}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, cleanListBullets: e.target.checked }))
                      }
                      className="mt-0.5 rounded border-zinc-300 text-primary focus:ring-primary"
                    />
                    <div className="text-xs leading-normal">
                      <span className="font-medium text-foreground block">
                        Fix List Bullets &amp; Indents
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Removes stray <code>&lt;br&gt; *</code> tags and trims accidental single-space indents to avoid unwanted sub-bullets.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.normalizeMath}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, normalizeMath: e.target.checked }))
                      }
                      className="mt-0.5 rounded border-zinc-300 text-primary focus:ring-primary"
                    />
                    <div className="text-xs leading-normal">
                      <span className="font-medium text-foreground block">
                        Normalize Math &amp; LaTeX
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Converts Anki MathJax tags and raw <code>\(\)</code> / <code>\[\]</code> delimiters into standard <code>$..$</code> and <code>$$..$$</code>.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.htmlToMarkdown}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, htmlToMarkdown: e.target.checked }))
                      }
                      className="mt-0.5 rounded border-zinc-300 text-primary focus:ring-primary"
                    />
                    <div className="text-xs leading-normal">
                      <span className="font-medium text-foreground block">
                        Convert HTML to Markdown
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Translates legacy HTML formatting tags (<code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;ul&gt;</code>) into native clean Markdown.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.stripFieldLabels}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, stripFieldLabels: e.target.checked }))
                      }
                      className="mt-0.5 rounded border-zinc-300 text-primary focus:ring-primary"
                    />
                    <div className="text-xs leading-normal">
                      <span className="font-medium text-foreground block">
                        Strip Redundant Field Labels
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Removes repetitive prefixes like <code>**Front:**</code> or <code>**Antwort:**</code> that were hardcoded into fields.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.normalizeWhitespace}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, normalizeWhitespace: e.target.checked }))
                      }
                      className="mt-0.5 rounded border-zinc-300 text-primary focus:ring-primary"
                    />
                    <div className="text-xs leading-normal">
                      <span className="font-medium text-foreground block">
                        Clean Spacing &amp; Linebreaks
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Trims line-end whitespace and standardizes double line breaks between paragraphs.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Secondary Actions */}
                <div className="pt-4 border-t flex flex-col gap-2">
                  <Button
                    onClick={handleSendToWorkspace}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8 justify-start gap-2"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Send to Schedae Workspace (MD &rarr; APKG)</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Card Inspection & Diff View */}
          <div className="flex flex-col border rounded-xl overflow-hidden bg-card shadow-2xs min-h-[500px]">
            {/* Top Toolbar */}
            <div className="bg-muted/40 px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Card Inspector
                </span>
                <Badge variant="secondary" className="text-[10px] leading-none py-1">
                  Card {selectedCardIndex + 1} of {filteredNoteItems.length}
                </Badge>
              </div>

              {/* Search Bar */}
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter cards..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedCardIndex(0);
                  }}
                  className="w-full text-xs bg-background border rounded-lg pl-8 pr-3 py-1 focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* View Tabs */}
              <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 border text-xs">
                <button
                  onClick={() => setActiveTab("diff")}
                  className={`px-3 py-1 rounded-md transition-all font-medium ${
                    activeTab === "diff"
                      ? "bg-white text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Diff Compare
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1 rounded-md transition-all font-medium ${
                    activeTab === "preview"
                      ? "bg-white text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Rendered Preview
                </button>
                <button
                  onClick={() => setActiveTab("raw")}
                  className={`px-3 py-1 rounded-md transition-all font-medium ${
                    activeTab === "raw"
                      ? "bg-white text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Raw Metadata
                </button>
              </div>
            </div>

            {/* Inspector Body */}
            {currentItem ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Active Card Header */}
                <div className="px-4 py-2 border-b bg-muted/15 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-medium text-foreground">
                      Note #{currentItem.id}
                    </span>
                    <span>&bull;</span>
                    <span className="truncate max-w-[200px]">{currentItem.deckName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentItem.scheduling ? (
                      <Badge variant="outline" className="text-[10px] leading-none py-0.5 bg-background">
                        <Clock className="w-3 h-3 mr-1 text-zinc-500" />
                        Queue: {currentItem.scheduling.queue ?? 0} &bull; Reps: {currentItem.scheduling.reps ?? 0}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] leading-none py-0.5 bg-background">
                        New Card
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content View Modes */}
                <div className="flex-1 min-h-0 p-4">
                  {activeTab === "diff" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                      {/* Original */}
                      <div className="flex flex-col border rounded-lg bg-zinc-50/50 overflow-hidden">
                        <div className="px-3 py-1.5 border-b bg-zinc-100 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider flex justify-between">
                          <span>Original (Legacy HTML / Raw)</span>
                          <span className="text-[10px] lowercase text-zinc-400">before</span>
                        </div>
                        <ScrollArea className="flex-1 p-3">
                          <div className="space-y-3 font-mono text-xs">
                            <div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                                Front
                              </span>
                              <pre className="whitespace-pre-wrap text-zinc-800 break-words bg-white p-2 rounded border border-zinc-200/80">
                                {currentItem.originalFront || "(Empty)"}
                              </pre>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                                Back
                              </span>
                              <pre className="whitespace-pre-wrap text-zinc-800 break-words bg-white p-2 rounded border border-zinc-200/80">
                                {currentItem.originalBack || "(Empty)"}
                              </pre>
                            </div>
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Remastered */}
                      <div className="flex flex-col border rounded-lg bg-emerald-50/20 border-emerald-200 overflow-hidden">
                        <div className="px-3 py-1.5 border-b bg-emerald-50 text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex justify-between">
                          <span>Remastered (Clean Markdown)</span>
                          <span className="text-[10px] lowercase text-emerald-600 font-bold">after</span>
                        </div>
                        <ScrollArea className="flex-1 p-3">
                          <div className="space-y-3 font-mono text-xs">
                            <div>
                              <span className="text-[10px] font-bold text-emerald-900 uppercase block mb-1">
                                Front
                              </span>
                              <pre className="whitespace-pre-wrap text-foreground break-words bg-white p-2 rounded border border-emerald-200">
                                {currentItem.transformedFront || "(Empty)"}
                              </pre>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-emerald-900 uppercase block mb-1">
                                Back
                              </span>
                              <pre className="whitespace-pre-wrap text-foreground break-words bg-white p-2 rounded border border-emerald-200">
                                {currentItem.transformedBack || "(Empty)"}
                              </pre>
                            </div>
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  )}

                  {activeTab === "preview" && (
                    <div className="h-full flex flex-col border rounded-xl p-6 bg-white shadow-2xs overflow-y-auto">
                      <div className="max-w-2xl mx-auto w-full space-y-6">
                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                            Front (Question)
                          </span>
                          <div className="p-4 rounded-xl bg-zinc-50 border text-foreground font-medium text-base">
                            <KaTeXRenderer text={currentItem.transformedFront} />
                          </div>
                        </div>

                        <hr className="border-border/60" />

                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                            Back (Answer &bull; Markdown &amp; Math)
                          </span>
                          <div className="p-4 rounded-xl bg-zinc-50 border text-foreground text-sm">
                            <KaTeXRenderer text={currentItem.transformedBack} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "raw" && (
                    <div className="h-full border rounded-lg bg-zinc-900 text-zinc-100 p-4 font-mono text-xs overflow-auto">
                      <pre>{JSON.stringify(currentItem, null, 2)}</pre>
                    </div>
                  )}
                </div>

                {/* Card Navigation Pagination Footer */}
                <div className="p-3 border-t bg-muted/20 flex items-center justify-between shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedCardIndex <= 0}
                    onClick={() => setSelectedCardIndex((prev) => Math.max(0, prev - 1))}
                    className="h-8 text-xs"
                  >
                    Previous Card
                  </Button>

                  <span className="text-xs text-muted-foreground">
                    Card {selectedCardIndex + 1} of {filteredNoteItems.length}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedCardIndex >= filteredNoteItems.length - 1}
                    onClick={() =>
                      setSelectedCardIndex((prev) => Math.min(filteredNoteItems.length - 1, prev + 1))
                    }
                    className="h-8 text-xs"
                  >
                    Next Card
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground">
                <Search className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-xs">No cards matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
