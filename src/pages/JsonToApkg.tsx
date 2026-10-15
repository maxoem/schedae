import React, { useRef, useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAiSettings, StreamingResponseDialog, LlmGuideDialog } from "@/components/flashcard/AiSettingsPanel";
import { useKeyboardShortcuts } from "@/components/flashcard/useKeyboardShortcuts";
import { useDeckWorkspace } from "@/hooks/useDeckWorkspace";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSourcePanel } from "@/components/workspace/WorkspaceSourcePanel";
import { WorkspacePreviewPanel } from "@/components/workspace/WorkspacePreviewPanel";
import { WorkspaceParserSheet } from "@/components/workspace/WorkspaceParserSheet";
import { AlertCircle, X } from "lucide-react";

export default function JsonToApkg() {
  const ai = useAiSettings();
  const abortRef = useRef<AbortController | null>(null);

  const workspace = useDeckWorkspace(ai.stencil);

  // Keyboard shortcuts (Ctrl+Enter to save batch, Ctrl+S to export, Ctrl+M to toggle rules)
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

  return (
    <TooltipProvider>
      <div className="relative h-full flex-1 min-h-0 overflow-hidden bg-[#F4F5F7] flex flex-col w-full">
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
          onOpenParserSettings={() => workspace.setIsSheetOpen(true)}
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

        {/* Modern 2-Column Split Workspace (Source & Live Deck) */}
        <main className="flex-1 min-h-0 p-3 md:p-4 grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 overflow-hidden max-w-[1920px] mx-auto w-full">
          {/* Column 1: Source Notes Editor */}
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
            onOpenParserSettings={() => workspace.setIsSheetOpen(true)}
            onAddToDeck={workspace.addCurrentAsBatch}
            isProcessing={workspace.isProcessing}
            onFileLoaded={(_text, filename) => {
              if (filename) {
                const cleanName = filename.replace(/\.[^/.]+$/, "");
                workspace.setDeckName(cleanName);
              }
            }}
          />

          {/* Column 2: Live Flashcard Deck Preview with Collapsible Batches */}
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
            onOpenParserSettings={() => workspace.setIsSheetOpen(true)}
            diagnostics={workspace.parseResult.diagnostics}
          />
        </main>

        {/* Progressive Disclosure: Parser & Delimiter Tuning Slide-Over Sheet */}
        <WorkspaceParserSheet
          open={workspace.isSheetOpen}
          onOpenChange={workspace.setIsSheetOpen}
          parserMode={workspace.parserMode}
          onParserModeChange={workspace.setParserMode}
          selectedModel={workspace.selectedModel}
          onModelChange={workspace.setSelectedModel}
          validateJson={workspace.validateJson}
          onValidateJsonChange={workspace.setValidateJson}
          splitSettings={workspace.splitSettings}
          onSplitSettingsChange={workspace.setSplitSettings}
          sampleText={workspace.sourceText}
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
    </TooltipProvider>
  );
}