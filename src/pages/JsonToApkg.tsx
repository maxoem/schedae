import React, { useRef, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAiSettings, StreamingResponseDialog, LlmGuideDialog } from "@/components/flashcard/AiSettingsPanel";
import { useKeyboardShortcuts } from "@/components/flashcard/useKeyboardShortcuts";
import { useDeckWorkspace } from "@/hooks/useDeckWorkspace";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSourcePanel } from "@/components/workspace/WorkspaceSourcePanel";
import { WorkspacePreviewPanel } from "@/components/workspace/WorkspacePreviewPanel";
import { WorkspaceParserSheet } from "@/components/workspace/WorkspaceParserSheet";
import { Seo, getSiteUrl } from "@/components/Seo";
import { AlertCircle, X, FileText, Layers, ShieldCheck, Sigma, Sparkles, RefreshCw, ArrowRight } from "lucide-react";

export default function JsonToApkg() {
  const [mobileActiveTab, setMobileActiveTab] = useState<"source" | "preview">("source");
  const [sheetActiveTab, setSheetActiveTab] = useState<"card" | "parser">("card");
  const ai = useAiSettings();
  const abortRef = useRef<AbortController | null>(null);

  const workspace = useDeckWorkspace(ai.stencil);

  const handleOpenParserSettings = useCallback(() => {
    setSheetActiveTab("parser");
    workspace.setIsSheetOpen(true);
  }, [workspace]);

  const handleOpenCardSettings = useCallback(() => {
    setSheetActiveTab("card");
    workspace.setIsSheetOpen(true);
  }, [workspace]);

  // Keyboard shortcuts (Ctrl+Enter to save batch, Ctrl+S to export, Ctrl+M to toggle rules/settings)
  useKeyboardShortcuts({
    onCompile: () => {
      if (workspace.draftCards.length > 0) {
        workspace.addCurrentAsBatch();
      }
    },
    onExport: () => {
      if (workspace.totalCardCount > 0) {
        workspace.exportApkg();
      }
    },
    onToggleMarkers: () => {
      if (!workspace.isSheetOpen) {
        setSheetActiveTab("card");
      }
      workspace.setIsSheetOpen((prev) => !prev);
    },
  });

  // Handler for AI stencil structure derivation
  const handleAnalyzeStructure = useCallback(async () => {
    if (!workspace.sourceText.trim()) return;
    if (ai.llmModels.length === 0) {
      ai.setIsLlmGuideOpen(true);
      return;
    }
    if (!ai.selectedLlmModel) {
      workspace.setExportError("Please select a local LLM model in settings.");
      return;
    }

    abortRef.current = new AbortController();
    await ai.deriveStencil(workspace.sourceText, {
      onError: (msg) => workspace.setExportError(msg),
      onDone: () => {},
    });
  }, [workspace, ai]);

  const handleClearStencil = useCallback(() => {
    ai.setStencil(null);
  }, [ai]);

  const siteUrl = getSiteUrl();
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Schedae",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: `${siteUrl}/`,
      description:
        "Convert Markdown notes, Q&A lists, and JSON into Anki .apkg flashcard decks directly in your browser with KaTeX math, syntax highlighting, and zero server uploads.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Markdown and JSON to Anki .apkg compilation",
        "100% client-side SQLite WebAssembly execution",
        "KaTeX math formula and code syntax highlighting",
        "APKG to Markdown decompiler and lossless LLM merge",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How does Schedae convert Markdown and JSON to Anki .apkg?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Schedae parses your Markdown headings, Q:/A: blocks, bold markers, or JSON card arrays directly in the browser and compiles a native Anki .apkg SQLite archive using WebAssembly (sql.js).",
          },
        },
        {
          "@type": "Question",
          name: "Are my notes or flashcards uploaded to a server?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. All parsing, rendering, and .apkg generation happens 100% locally on your device. Nothing is sent to external servers.",
          },
        },
        {
          "@type": "Question",
          name: "Does Schedae support LaTeX math and custom Anki fields?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Inline ($...$) and block ($$...$$) KaTeX formulas, fenced code blocks, and arbitrary custom Anki note fields are supported out of the box.",
          },
        },
      ],
    },
  ];

  return (
    <TooltipProvider>
      <Seo
        title="Markdown & JSON to Anki (.apkg) Converter — Free & Local"
        description="Convert Markdown notes, Q&A lists, and JSON into Anki .apkg flashcard decks directly in your browser. Supports KaTeX math, code highlighting, and custom fields — 100% private and offline."
        canonicalPath="/"
        jsonLd={structuredData}
      />
      <div className="w-full flex flex-col">
        <div className="relative h-[calc(100dvh-4.75rem)] min-h-[540px] overflow-hidden bg-[#F4F5F7] flex flex-col w-full shrink-0">
        {/* Workspace Top Header */}
        <WorkspaceHeader
          deckName={workspace.deckName}
          onDeckNameChange={workspace.setDeckName}
          cardCount={workspace.totalCardCount}
          batchCount={workspace.batches.length}
          draftCount={workspace.draftCards.length}
          savedCount={workspace.deckCards.length}
          isProcessing={workspace.isProcessing || ai.isStreamingActive}
          onExport={workspace.exportApkg}
          onOpenParserSettings={handleOpenCardSettings}
          hasCustomRules={Boolean(ai.stencil) || workspace.parserRule === "custom"}
        />

        {/* Global Error Banner */}
        {workspace.exportError && (
          <div className="max-w-[1920px] mx-auto w-full px-3 md:px-4 pt-3 shrink-0">
            <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between shrink-0 animate-in fade-in-50">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{workspace.exportError}</span>
              </div>
              <button
                onClick={() => workspace.setExportError(null)}
                className="p-1 hover:bg-destructive/20 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile / Narrow Screen View Switcher (< lg) */}
        <div className="lg:hidden px-2.5 sm:px-3 pt-2 shrink-0 max-w-[1920px] mx-auto w-full">
          <div className="flex items-center bg-zinc-200/70 p-1 rounded-xl border border-zinc-200/80 shadow-2xs gap-1">
            <button
              type="button"
              onClick={() => setMobileActiveTab("source")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mobileActiveTab === "source"
                  ? "bg-white text-zinc-950 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-950 hover:bg-white/40"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notes</span>
              {workspace.draftCards.length > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                  {workspace.draftCards.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileActiveTab("preview")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mobileActiveTab === "preview"
                  ? "bg-white text-zinc-950 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-950 hover:bg-white/40"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Deck Preview</span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  workspace.totalCardCount > 0
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-500 border border-zinc-200/80"
                }`}
              >
                {workspace.totalCardCount}
              </span>
            </button>
          </div>
        </div>

        {/* Responsive Workspace: Tabbed on narrow screens (< lg), 2-Column Split on desktop (>= lg) */}
        <div className="flex-1 min-h-0 p-2 sm:p-3 md:p-4 flex flex-col lg:grid lg:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4 overflow-hidden max-w-[1920px] mx-auto w-full">
          {/* Column 1: Source Notes Editor */}
          <div className={`h-full min-h-0 ${mobileActiveTab === "source" ? "flex flex-col flex-1" : "hidden lg:flex lg:flex-col"}`}>
            <WorkspaceSourcePanel
              value={workspace.sourceText}
              onChange={workspace.setSourceText}
              markerPatterns={workspace.highlightPatterns}
              detectedFormatLabel={workspace.parseResult.detectedFormatLabel}
              detectedCardCount={workspace.draftCards.length}
              parserRule={workspace.parserRule}
              onParserRuleChange={workspace.setParserRule}
              hasCustomRules={Boolean(ai.stencil) || workspace.parserRule === "custom"}
              onLoadSample={workspace.loadSample}
              onClear={workspace.clearSource}
              onOpenParserSettings={handleOpenParserSettings}
              onAddToDeck={workspace.addCurrentAsBatch}
              onViewPreview={() => setMobileActiveTab("preview")}
              isProcessing={workspace.isProcessing}
              onFileLoaded={(_text, filename) => {
                if (filename) {
                  const cleanName = filename.replace(/\.[^/.]+$/, "");
                  workspace.setDeckName(cleanName);
                }
              }}
              mediaItems={workspace.mediaItems}
              draftMediaFilenames={workspace.draftMediaFilenames}
              batchMediaFilenames={workspace.batchMediaFilenames}
              missingMediaFilenames={workspace.missingMediaFilenames}
              onAttachMedia={workspace.attachMediaFiles}
              onInsertMediaSnippet={workspace.insertMediaSnippet}
              onRemoveMedia={workspace.removeMediaItem}
            />
          </div>

          {/* Column 2: Live Flashcard Deck Preview with Collapsible Batches */}
          <div className={`h-full min-h-0 ${mobileActiveTab === "preview" ? "flex flex-col flex-1" : "hidden lg:flex lg:flex-col"}`}>
            <WorkspacePreviewPanel
              batches={workspace.batches}
              draftCards={workspace.draftCards}
              selectedTemplate={workspace.selectedTemplate}
              onTemplateChange={workspace.setSelectedTemplate}
              searchQuery={workspace.searchQuery}
              onSearchChange={workspace.setSearchQuery}
              viewMode={workspace.previewViewMode}
              onViewModeChange={workspace.setPreviewViewMode}
              onDeleteBatch={workspace.deleteBatch}
              onDeleteCardFromBatch={workspace.deleteCardFromBatch}
              onDeleteDraftCard={workspace.deleteDraftCard}
              onClearDeck={workspace.clearDeck}
              onSaveDraftToDeck={workspace.addCurrentAsBatch}
              onLoadSample={workspace.loadSample}
              onOpenParserSettings={handleOpenParserSettings}
              onOpenCardSettings={handleOpenCardSettings}
              extractTopicBadges={workspace.extractTopicBadges}
              onBackToSource={() => setMobileActiveTab("source")}
              diagnostics={workspace.parseResult.diagnostics}
              mediaUrlMap={workspace.mediaUrlMap}
            />
          </div>
        </div>

        {/* Progressive Disclosure: Parser & Delimiter Tuning Slide-Over Sheet */}
        <WorkspaceParserSheet
          open={workspace.isSheetOpen}
          onOpenChange={workspace.setIsSheetOpen}
          activeTab={sheetActiveTab}
          onActiveTabChange={setSheetActiveTab}
          parserMode={workspace.parserMode}
          onParserModeChange={workspace.setParserMode}
          selectedModel={workspace.selectedModel}
          onModelChange={workspace.setSelectedModel}
          validateJson={workspace.validateJson}
          onValidateJsonChange={workspace.setValidateJson}
          extractTopicBadges={workspace.extractTopicBadges}
          onExtractTopicBadgesChange={workspace.setExtractTopicBadges}
          splitSettings={workspace.splitSettings}
          onSplitSettingsChange={workspace.setSplitSettings}
          sampleText={workspace.sourceText}
          selectedTemplate={workspace.selectedTemplate}
          onTemplateChange={workspace.setSelectedTemplate}
          noteTypeMode={workspace.noteTypeMode}
          onNoteTypeModeChange={workspace.setNoteTypeMode}
          customNoteTypeName={workspace.customNoteTypeName}
          onCustomNoteTypeNameChange={workspace.setCustomNoteTypeName}
          exportMathFormat={workspace.exportMathFormat}
          onExportMathFormatChange={workspace.setExportMathFormat}
          exportImageFormat={workspace.exportImageFormat}
          onExportImageFormatChange={workspace.setExportImageFormat}
          activeCards={workspace.activeCards}
          aiSettings={ai}
          onDeriveStencil={handleAnalyzeStructure}
          clearStencil={handleClearStencil}
          isProcessing={workspace.isProcessing}
          aiError={workspace.exportError}
        />

        {/* Supporting Dialogs */}
        <StreamingResponseDialog
          open={ai.isStreamDialogOpen}
          onClose={() => ai.setIsStreamDialogOpen(false)}
          onCloseAbort={() => {
            abortRef.current?.abort();
            ai.setIsStreamingActive(false);
          }}
          isStreaming={ai.isStreamingActive}
          streamText={ai.streamText}
        />
        <LlmGuideDialog
          open={ai.isLlmGuideOpen}
          onRefresh={ai.fetchLlmModels}
          onClose={() => ai.setIsLlmGuideOpen(false)}
        />
        </div>

        {/* Crawlable Product Overview & FAQ below the fold */}
        <section
          aria-labelledby="schedae-overview-heading"
          className="w-full bg-white border-t border-zinc-200/80 py-14 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="space-y-4 max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Local-First Anki Compiler Toolchain
              </p>
              <h1
                id="schedae-overview-heading"
                className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950"
              >
                Markdown &amp; JSON to Anki (.apkg) Converter
              </h1>
              <p className="text-base sm:text-lg text-zinc-600 leading-relaxed">
                Schedae turns structured Markdown notes, Q&amp;A lists, and JSON card arrays into ready-to-study Anki{" "}
                <code className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-900 text-sm font-mono">.apkg</code> decks
                directly in your browser. Built for students, researchers, and LLM-assisted study workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-5 space-y-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-semibold text-zinc-950">100% Client-Side &amp; Private</h2>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Compiles native SQLite <code className="font-mono">.apkg</code> archives via WebAssembly (sql.js) on your device. Zero uploads, zero tracking.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-5 space-y-2">
                <Sigma className="w-5 h-5 text-zinc-900" />
                <h2 className="text-sm font-semibold text-zinc-950">KaTeX Math &amp; Code</h2>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Full support for inline <code className="font-mono">$...$</code> and block <code className="font-mono">$$...$$</code> LaTeX formulas, tables, and syntax-highlighted code blocks.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-5 space-y-2">
                <Sparkles className="w-5 h-5 text-zinc-900" />
                <h2 className="text-sm font-semibold text-zinc-950">Flexible Parser Rules</h2>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Auto-detects <code className="font-mono">### Question</code> / <code className="font-mono">### Answer</code>, <code className="font-mono">Q:</code>/<code className="font-mono">A:</code> blocks, bold markers, JSON, and custom Anki note fields.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-5 space-y-2">
                <RefreshCw className="w-5 h-5 text-zinc-900" />
                <h2 className="text-sm font-semibold text-zinc-950">Full Anki Round-Trip</h2>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Decompile existing decks with{" "}
                  <Link to="/configure" className="underline underline-offset-2 text-zinc-900 font-medium">
                    APKG → MD
                  </Link>{" "}
                  or refine cards with AI without losing scheduling intervals via{" "}
                  <Link to="/llm-merge" className="underline underline-offset-2 text-zinc-900 font-medium">
                    Lossless Merge
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-200/80 pt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-950 mb-2">Frequently Asked Questions</h2>
                <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                  Everything you need to know about converting Markdown and JSON notes into Anki flashcards.
                </p>
                <Link
                  to="/decks"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:underline underline-offset-4"
                >
                  <span>Browse curated study decks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="rounded-xl border border-zinc-200/80 p-4">
                  <h3 className="text-sm font-semibold text-zinc-950">
                    How does Schedae convert Markdown and JSON to Anki .apkg?
                  </h3>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                    Paste Markdown notes, drop a <code className="font-mono">.md</code> or <code className="font-mono">.json</code> file, or load a sample template. Schedae parses cards in real time and exports a standard <code className="font-mono">.apkg</code> package compatible with Anki Desktop, AnkiDroid, and AnkiMobile.
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200/80 p-4">
                  <h3 className="text-sm font-semibold text-zinc-950">
                    Are my notes or flashcards uploaded to a server?
                  </h3>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                    No. All parsing, card previewing, and SQLite packaging run 100% locally in your browser via WebAssembly.
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200/80 p-4">
                  <h3 className="text-sm font-semibold text-zinc-950">
                    Can I use ChatGPT, Claude, or local LLMs with Schedae?
                  </h3>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                    Yes. Copy the built-in Format Prompt or read the{" "}
                    <Link to="/genai-cards" className="underline underline-offset-2 text-zinc-900 font-medium">
                      AI Flashcard Guide
                    </Link>{" "}
                    to generate clean, structured flashcards ready for one-click export.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </TooltipProvider>
  );
}