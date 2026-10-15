import { useState, useEffect, useRef } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Brain, Loader2, Trash2, Sparkles, ArrowDown, ArrowUp, Radio, Waves } from "lucide-react";
import { deriveStencilFromExampleMarkdown, listAvailableLlmModels, type Stencil, type LlmModelInfo } from "@/lib/extraction";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AiModelPresetId = "auto" | "gemini" | "chatgpt" | "claude";

interface AiModelPreset {
  id: AiModelPresetId;
  label: string;
  description: string;
}

const AI_MODEL_PRESETS: Record<AiModelPresetId, AiModelPreset> = {
  auto: {
    id: "auto",
    label: "Auto / Generic",
    description: "No model-specific cleanup. Uses your current delimiters.",
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    description: "Removes Gemini citation tags and applies markdown-friendly separators.",
  },
  chatgpt: {
    id: "chatgpt",
    label: "OpenAI ChatGPT",
    description: "Keeps markdown sections and common Q/A markers.",
  },
  claude: {
    id: "claude",
    label: "Anthropic Claude",
    description: "Optimized for Claude style with bold Q/A markers.",
  },
};

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

function loadStoredString(key: string, fallback: string): string {
  try {
    const v = localStorage.getItem(key);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseAiSettingsReturn {
  selectedModel: AiModelPresetId;
  setSelectedModel: (m: AiModelPresetId) => void;
  llmModels: LlmModelInfo[];
  llmModelsLoading: boolean;
  selectedLlmModel: string | null;
  setSelectedLlmModel: (m: string | null) => void;
  llmStreaming: boolean;
  setLlmStreaming: (s: boolean) => void;
  stencil: Stencil | null;
  setStencil: (s: Stencil | null) => void;
  fetchLlmModels: () => Promise<void>;
  deriveStencil: (
    input: string,
    opts?: { onError?: (err: string) => void; onDone?: () => void }
  ) => Promise<void>;
  isStreamingActive: boolean;
  setIsStreamingActive: (v: boolean) => void;
  streamText: string;
  setStreamText: (v: string) => void;
  isStreamDialogOpen: boolean;
  setIsStreamDialogOpen: (v: boolean) => void;
  isLlmGuideOpen: boolean;
  setIsLlmGuideOpen: (v: boolean) => void;
}

export function useAiSettings(): UseAiSettingsReturn {
  const [selectedModel, setSelectedModel] = useState<AiModelPresetId>(() =>
    loadStoredString("json-apkg-ai-model", "auto") as AiModelPresetId
  );

  const [llmModels, setLlmModels] = useState<LlmModelInfo[]>([]);
  const [llmModelsLoading, setLlmModelsLoading] = useState(false);
  const [selectedLlmModel, setSelectedLlmModel] = useState<string | null>(() =>
    loadStoredString("json-apkg-llm-model", "") || null
  );
  const [llmStreaming, setLlmStreaming] = useState<boolean>(() =>
    loadStoredString("json-apkg-llm-stream", "false") === "true"
  );
  const [stencil, setStencil] = useState<Stencil | null>(() => {
    try {
      const raw = localStorage.getItem("json-apkg-stencil");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // UI state for streaming / dialogs
  const [isStreamingActive, setIsStreamingActive] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [isStreamDialogOpen, setIsStreamDialogOpen] = useState(false);
  const [isLlmGuideOpen, setIsLlmGuideOpen] = useState(false);

  const streamAbortRef = useRef<AbortController | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem("json-apkg-ai-model", selectedModel);
  }, [selectedModel]);
  useEffect(() => {
    try {
      if (selectedLlmModel) localStorage.setItem("json-apkg-llm-model", selectedLlmModel);
      else localStorage.removeItem("json-apkg-llm-model");
    } catch { /* ignore */ }
  }, [selectedLlmModel]);
  useEffect(() => {
    try { localStorage.setItem("json-apkg-llm-stream", String(llmStreaming)); }
    catch { /* ignore */ }
  }, [llmStreaming]);
  useEffect(() => {
    try {
      if (stencil) localStorage.setItem("json-apkg-stencil", JSON.stringify(stencil));
      else localStorage.removeItem("json-apkg-stencil");
    } catch { /* ignore */ }
  }, [stencil]);

  const fetchLlmModels = async () => {
    setLlmModelsLoading(true);
    try {
      const models = await listAvailableLlmModels();
      setLlmModels(models || []);
    } catch {
      setLlmModels([]);
    } finally {
      setLlmModelsLoading(false);
    }
  };

  useEffect(() => { fetchLlmModels(); }, []);

  const deriveStencil = async (
    input: string,
    opts?: { onError?: (err: string) => void; onDone?: () => void }
  ) => {
    if (!input.trim()) return;
    if (!llmModels.length) { setIsLlmGuideOpen(true); return; }
    if (!selectedLlmModel) return;

    const controller = new AbortController();
    streamAbortRef.current = controller;
    setIsStreamDialogOpen(true);
    setIsStreamingActive(true);
    setStreamText("");

    try {
      const example = input.split(/\n{2,}/).find((c) => c.trim()) || input;
      const derived = await deriveStencilFromExampleMarkdown(example, {
        model: selectedLlmModel,
        signal: controller.signal,
        onChunk: (chunk: string) => setStreamText(chunk),
        stream: llmStreaming,
      });
      setStencil(derived);
      setIsStreamingActive(false);
      opts?.onDone?.();
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error(err);
      opts?.onError?.(err instanceof Error ? err.message : String(err));
      setIsStreamingActive(false);
    } finally {
      streamAbortRef.current = null;
    }
  };

  return {
    selectedModel,
    setSelectedModel,
    llmModels,
    llmModelsLoading,
    selectedLlmModel,
    setSelectedLlmModel,
    llmStreaming,
    setLlmStreaming,
    stencil,
    setStencil,
    fetchLlmModels,
    deriveStencil,
    isStreamingActive,
    setIsStreamingActive,
    streamText,
    setStreamText,
    isStreamDialogOpen,
    setIsStreamDialogOpen,
    isLlmGuideOpen,
    setIsLlmGuideOpen,
  };
}

// ---------------------------------------------------------------------------
// Streaming Response Dialog
// ---------------------------------------------------------------------------

function StreamingResponseDialog({
  open,
  onClose,
  onCloseAbort,
  isStreaming,
  streamText,
}: {
  open: boolean;
  onClose: () => void;
  onCloseAbort: () => void;
  isStreaming: boolean;
  streamText: string;
}) {
  const preRef = useRef<HTMLElement | null>(null);
  const userScrolledUpRef = useRef(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  useEffect(() => {
    try {
      if (preRef.current && !userScrolledUpRef.current) {
        preRef.current.scrollTop = preRef.current.scrollHeight;
      }
    } catch { /* ignore */ }
  }, [streamText]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && isStreaming) onCloseAbort();
        onClose();
      }}
    >
      <DialogContent className="w-full max-h-[90vh] p-6">
        <DialogHeader>
          <DialogTitle>
            {isStreaming ? "Analyzing structure..." : "Analysis output"}
          </DialogTitle>
          <DialogDescription>
            {isStreaming
              ? "Streaming live output from the model."
              : "Final output from the model."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  isStreaming ? "bg-primary animate-pulse" : "bg-emerald-400"
                }`}
              />
              <div className="text-xs text-muted-foreground">
                {isStreaming ? "Receiving..." : "Completed"}
              </div>
            </div>
            {userScrolledUp && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  userScrolledUpRef.current = false;
                  setUserScrolledUp(false);
                  if (preRef.current) preRef.current.scrollTop = preRef.current.scrollHeight;
                }}
              >
                Jump to latest
              </Button>
            )}
          </div>

          <pre
            ref={(el) => { preRef.current = el; }}
            onScroll={(e) => {
              try {
                const el = e.target as HTMLElement;
                const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
                userScrolledUpRef.current = !nearBottom;
                setUserScrolledUp(!nearBottom);
              } catch { /* ignore */ }
            }}
            className="bg-background border rounded p-4 max-h-[60vh] overflow-y-auto text-xs font-mono whitespace-pre-wrap"
          >
            {streamText || (isStreaming ? "Waiting for data..." : "")}
          </pre>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          {isStreaming ? (
            <Button size="sm" variant="outline" onClick={onCloseAbort}>
              Cancel
            </Button>
          ) : null}
          <Button size="sm" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Local LLM Guide Dialog
// ---------------------------------------------------------------------------

function LlmGuideDialog({
  open,
  onRefresh,
  onClose,
}: {
  open: boolean;
  onRefresh: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle>Local LLM Not Available</DialogTitle>
          <DialogDescription>
            A local Ollama model is required for AI structure analysis. Follow
            these steps to enable it.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 text-sm space-y-3">
          <ol className="list-decimal list-inside">
            <li>Start Ollama locally and ensure at least one model is running.</li>
            <li>
              Allow this site to access Ollama by setting the origin:{" "}
              <code>set OLLAMA_ORIGINS="&lt;the domain&gt;"</code>
            </li>
          </ol>
          <p className="text-xs text-muted-foreground mt-2">
            After starting Ollama, use <strong>Refresh</strong> to detect available models.
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Refresh Models
          </Button>
          <Button size="sm" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// AI Settings Panel (collapsible accordion - hidden by default)
// ---------------------------------------------------------------------------

/* ─────────────────────────────────────────────────────────
 *  AiSettingsPanel — modern AI heuristics configuration panel.
 *  Same tag-chip design language as InlineSplitSettings with
 *  larger, more readable text for the power-user workflow.
 * ───────────────────────────────────────────────────────── */

interface AiSettingsPanelProps {
  settings: UseAiSettingsReturn;
  onDeriveStencil: () => void;
  clearStencil: () => void;
  hasInput: boolean;
  stencilActive: boolean;
  error: string | null;
  isProcessing: boolean;
}

export function AiSettingsPanel({
  settings,
  onDeriveStencil,
  clearStencil,
  hasInput,
  stencilActive,
  error,
  isProcessing,
}: AiSettingsPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Error status */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/[0.06] border border-destructive/15">
          <Sparkles className="w-4 h-4 text-destructive/50 shrink-0" />
          <span className="text-xs text-destructive font-medium">{error}</span>
        </div>
      )}

      {/* Stencil indicator */}
      {stencilActive && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-emerald-600/80">Stencil Active</div>
            <div className="text-xs text-emerald-600/50 truncate mt-0.5">
              Using derived extraction path from previous analysis
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
            onClick={clearStencil}
            disabled={!settings.stencil}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        </div>
      )}

      {/* Target Model Normalizer Selector */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-foreground/80 cursor-default">Target Model Normalizer</Label>
        <select
          value={settings.selectedModel}
          onChange={(e) => settings.setSelectedModel(e.target.value as AiModelPresetId)}
          className="w-full h-8.5 rounded-lg border border-border bg-background px-3 text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer text-foreground"
        >
          {(Object.keys(AI_MODEL_PRESETS) as AiModelPresetId[]).map((id) => (
            <option key={id} value={id}>
              {AI_MODEL_PRESETS[id].label} — {AI_MODEL_PRESETS[id].description}
            </option>
          ))}
        </select>
      </div>

      {/* Local LLM Model configuration - directly written */}
      <div className="space-y-4 pt-2 border-t border-border/50">
        {/* LLM Model selector */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-muted-foreground/60" />
            <Label className="text-xs font-semibold text-foreground/80 cursor-default">Local LLM Model</Label>
          </div>
          <div className="flex gap-2">
            <select
              className="flex-1 h-8 rounded-md border bg-background px-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              value={settings.selectedLlmModel ?? ""}
              onChange={(e) => settings.setSelectedLlmModel(e.target.value || null)}
              disabled={settings.llmModelsLoading || settings.llmModels.length === 0}
            >
              <option value="">
                {settings.llmModelsLoading ? "Loading..." : settings.llmModels.length ? "Select a model" : "No models available"}
              </option>
              {settings.llmModels.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} {m.details?.parameter_size ? `(${m.details.parameter_size})` : ""}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={settings.fetchLlmModels}
              disabled={settings.llmModelsLoading}
              className="h-8 px-2.5"
            >
              {settings.llmModelsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            </Button>
          </div>
          {!settings.llmModels.length && !settings.llmModelsLoading && (
            <p className="text-xs text-muted-foreground/60 leading-relaxed mt-1">
              No local LLM models detected. Start Ollama and ensure at least one model is available.
            </p>
          )}
        </div>

        {/* Streaming toggle */}
        <div className="flex items-start justify-between px-3 py-2.5 rounded-lg bg-muted/40 border border-border/40">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-muted-foreground/60" />
              <Label htmlFor="llm-stream" className="text-xs font-medium text-foreground cursor-pointer">
                Enable Streaming
              </Label>
            </div>
            <span className="text-xs text-muted-foreground leading-relaxed pl-5">
              Stream model output in real-time as it generates
            </span>
          </div>
          <Toggle checked={settings.llmStreaming} onChange={settings.setLlmStreaming} />
        </div>

        {/* Analyze action */}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 h-9 text-xs font-semibold bg-gradient-to-r from-purple-500/10 to-primary/10 hover:from-purple-500/15 hover:to-primary/15 border-purple-500/20 hover:border-purple-500/30 text-foreground"
          onClick={onDeriveStencil}
          disabled={!hasInput || isProcessing}
        >
          <Brain className="w-4 h-4 text-purple-500/70" />
          {isProcessing ? "Analyzing..." : "Analyze Structure & Derive Stencil"}
          {!hasInput && <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">No input text</Badge>}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle helper
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        checked ? "bg-primary" : "bg-zinc-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  AI_MODEL_PRESETS,
  StreamingResponseDialog,
  LlmGuideDialog,
  Toggle,
};
export type { AiModelPresetId };
