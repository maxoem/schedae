import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { FlashCard } from "@/converters/types";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { toString } from "mdast-util-to-string";

type MarkdownNode = {
  type: string;
  children?: MarkdownNode[];
  position?: {
    start?: { offset?: number };
    end?: { offset?: number };
  };
};

export interface SplitSettings {
  id?: string;
  name?: string;
  cardSeparators: string;
  questionMarkers: string;
  answerMarkers: string;
  includeCardSeparatorMarker: boolean;
  includeQuestionMarker: boolean;
  includeAnswerMarker: boolean;
  ignoreMarkerBrackets: boolean;
}

export const PREDEFINED_EXTRACTION_SETS: SplitSettings[] = [
  {
    id: "headings",
    name: "Markdown Headings",
    cardSeparators: "### Karte, ## Karte, # Karte, ### Card, ## Card, # Card",
    questionMarkers: "### Frage, ## Frage, # Frage, ### Question, ## Question, # Question",
    answerMarkers: "### Antwort, ## Antwort, # Antwort, ### Answer, ## Answer, # Answer",
    includeCardSeparatorMarker: false,
    includeQuestionMarker: false,
    includeAnswerMarker: false,
    ignoreMarkerBrackets: true,
  },
  {
    id: "bold-italic",
    name: "Bold and Italic",
    cardSeparators: "**Karte**, **Card**",
    questionMarkers: "*Frage:*, **Frage:**, *Question:*, **Question:**",
    answerMarkers: "*Antwort:*, **Antwort:**, *Answer:*, **Answer:**",
    includeCardSeparatorMarker: false,
    includeQuestionMarker: false,
    includeAnswerMarker: false,
    ignoreMarkerBrackets: true,
  },
  {
    id: "generic",
    name: "Generic (Plain Text)",
    cardSeparators: "Karte, Card, ***, ---",
    questionMarkers: "Frage:, Question:, Q:, Front:, Vorderseite:",
    answerMarkers: "Antwort:, Answer:, A:, Back:, Rückseite:",
    includeCardSeparatorMarker: false,
    includeQuestionMarker: false,
    includeAnswerMarker: false,
    ignoreMarkerBrackets: true,
  }
];

export const DEFAULT_SPLIT_SETTINGS: SplitSettings = PREDEFINED_EXTRACTION_SETS[2];

export interface HighlightMarkerPattern {
  regex: RegExp;
  className: string;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function normalizeSeparatorMarker(value: string) {
  return value
    .trim()
    .replace(/^\s*(?:#+\s+)?(?:\*\*|__)?/, "")
    .replace(/(?:\*\*|__)?\s*$/, "")
    .trim();
}

function buildSplitRegexes(settings: SplitSettings) {
  const getParts = (str: string) => str.split(",").map(s => s.trim()).filter(Boolean);

  const bParts = getParts(settings.cardSeparators);
  const blockPatterns = bParts.map((part) => {
    const marker = normalizeSeparatorMarker(part.replace(/:$/, ""));

    if (!marker || /^[*_-]+$/.test(marker)) {
      const escapedExact = escapeRegExp(part);
      return `^\\s*(?:[*+-]\\s+)?(?:#+\\s+)?(?:\\*\\*|__)?${escapedExact}(?:\\*\\*|__)?\\s*$`;
    }

    const escapedMarker = escapeRegExp(marker);
    return `^\\s*(?:[*+-]\\s+)?(?:#+\\s+)?(?:\\*\\*|__)?${escapedMarker}(?:\\b|$)(?:[^\\n]*)?(?:\\*\\*|__)?\\s*$`;
  });
  const blockRegex = blockPatterns.length > 0 ? new RegExp(blockPatterns.join("|"), "m") : /(?!x)x/;

  const bracketOpt = settings.ignoreMarkerBrackets ? `\\s*(?:\\([^)]*\\)|\\[[^\\]]*\\])?` : ``;

  const qParts = getParts(settings.questionMarkers).map(s => {
    const base = s.replace(/:$/, "");
    return escapeRegExp(base) + (base.match(/[a-zA-Z]$/) ? '\\b' : '');
  });
  const questionRegexStr = qParts.length > 0 
    ? `^\\s*(?:[*+-]\\s+)?(?:#+\\s+)?(?:\\*\\*|__)?(?:${qParts.join("|")})${bracketOpt}\\s*(?:\\*\\*|__)?\\s*:?\\s*(?:\\*\\*|__)?\\s*(.*)$`
    : `(?!x)x`;
  const questionRegex = new RegExp(questionRegexStr, "im");

  const aParts = getParts(settings.answerMarkers).map(s => {
    const base = s.replace(/:$/, "");
    return escapeRegExp(base) + (base.match(/[a-zA-Z]$/) ? '\\b' : '');
  });
  const answerRegexStr = aParts.length > 0 
    ? `^\\s*(?:[*+-]\\s+)?(?:#+\\s+)?(?:\\*\\*|__)?(?:${aParts.join("|")})${bracketOpt}\\s*(?:\\*\\*|__)?\\s*:?\\s*(?:\\*\\*|__)?\\s*(.*)$`
    : `(?!x)x`;
  const answerRegex = new RegExp(answerRegexStr, "im");

  return { blockRegex, questionRegex, answerRegex, qParts, aParts, bParts };
}

export const _markerCssClass = {
  separator: "text-zinc-700 dark:text-zinc-300 font-bold bg-zinc-100/90 dark:bg-zinc-800/70 rounded-xs",
  question: "text-sky-950 dark:text-sky-100 font-semibold bg-sky-100/80 dark:bg-sky-950/50 rounded-xs",
  answer: "text-emerald-950 dark:text-emerald-100 font-semibold bg-emerald-100/80 dark:bg-emerald-950/50 rounded-xs",
  customField: "text-amber-950 dark:text-amber-100 font-semibold bg-amber-100/80 dark:bg-amber-950/50 rounded-xs",
};

/**
 * Build syntax highlight patterns from SplitSettings and custom field names.
 * Reuses the internal buildSplitRegexes with the "g" flag so they work
 * on the full document text as a single string — each match highlights
 * the full line where a card separator, Q/A marker, or custom field appears.
 */
export function buildHighlightPatterns(
  settings: SplitSettings,
  customFieldNames?: string[]
): HighlightMarkerPattern[] {
  const { blockRegex, questionRegex, answerRegex } = buildSplitRegexes(settings);

  // Strip the "g" flag (if any), then re-add it so we always have global matching
  const withG = (rx: RegExp) => {
    const str = rx.source;
    const flags = rx.flags.replace(/g/, "");
    return new RegExp(str, flags + "g");
  };

  const patterns: HighlightMarkerPattern[] = [];
  if (blockRegex.source !== "(?!x)x") {
    patterns.push({ regex: withG(blockRegex), className: _markerCssClass.separator });
  }
  if (questionRegex.source !== "(?!x)x") {
    patterns.push({ regex: withG(questionRegex), className: _markerCssClass.question });
  }
  if (answerRegex.source !== "(?!x)x") {
    patterns.push({ regex: withG(answerRegex), className: _markerCssClass.answer });
  }

  // Explicit patterns for known custom fields
  if (customFieldNames && customFieldNames.length > 0) {
    const uniqueFields = Array.from(new Set(customFieldNames.filter(Boolean)));
    for (const field of uniqueFields) {
      const escaped = escapeRegExp(field);
      const headingRx = new RegExp(`^\\s*#{1,6}\\s+${escaped}(?:\\s*:.*|\\s*)$`, "gim");
      const kvRx = new RegExp(`^\\s*(?:[*+-]\\s+)?(?:\\*\\*|__)?${escaped}(?:\\*\\*|__)?\\s*:.*$`, "gim");
      patterns.push({ regex: headingRx, className: _markerCssClass.customField });
      patterns.push({ regex: kvRx, className: _markerCssClass.customField });
    }
  }

  return patterns;
}

function removeMarkerLines(text: string, markerRegex: RegExp): string {
  // Remove entire lines that match a marker (marker + content on that line).
  // Uses per-line `.test()` to avoid RegExp source manipulation issues.
  const cleanFlags = markerRegex.flags;
  const lines = text.split(/\r?\n/);
  const result: string[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (new RegExp(markerRegex.source, cleanFlags).test(line)) {
      // Marker line found – skip it entirely along with any following blank lines
      i++;
      while (i < lines.length && lines[i].trim() === '') i++;
    } else {
      result.push(line);
      i++;
    }
  }
  
  return result.join('\n');
}

export function extractFlashcardsFromText(text: string, settings: SplitSettings): FlashCard[] {
  const cards: FlashCard[] = [];
  const { blockRegex, questionRegex, answerRegex, bParts } = buildSplitRegexes(settings);

  // 1. Pre-process to ensure structural markers are partitioned into their own block-level nodes
  const lines = text.split("\n");
  const spacedLines = lines.map(line => {
    // If a line is a structural separator, a mapped question marker, or an answer marker
    if (blockRegex.test(line) || questionRegex.test(line) || answerRegex.test(line)) {
      return `\n\n${line}`;
    }
    return line;
  });
  const preprocessedText = spacedLines.join("\n");

  // 2. Parse Markdown to AST
  const tree = unified().use(remarkParse).parse(preprocessedText);

  // 3. Chunk tree into cards
  const cardChunks: MarkdownNode[][] = [];
  let currentChunk: MarkdownNode[] = [];
  let chunkHasQ = false;
  let chunkHasA = false;

  for (const node of (tree.children as MarkdownNode[])) {
    let nodeText = "";
    if (node.position?.start?.offset !== undefined && node.position?.end?.offset !== undefined) {
      nodeText = preprocessedText.substring(node.position.start.offset, node.position.end.offset);
    } else {
      nodeText = toString(node);
    }

    const isCardSeparator = blockRegex.test(nodeText) || (node.type === 'heading' && /^###?\s*Karte/i.test(nodeText));
    const isQuestion = questionRegex.test(nodeText);
    const isAnswer = answerRegex.test(nodeText);

    if (isCardSeparator) {
      if (currentChunk.length > 0) {
        cardChunks.push(currentChunk);
        currentChunk = [];
      }
      chunkHasQ = false;
      chunkHasA = false;
      continue;
    }

    if (isQuestion) {
      if (chunkHasQ) {
        if (currentChunk.length > 0) {
          cardChunks.push(currentChunk);
          currentChunk = [];
        }
        chunkHasA = false;
      }
      chunkHasQ = true;
    } else if (isAnswer) {
      if (chunkHasA && !chunkHasQ) {
        if (currentChunk.length > 0) {
          cardChunks.push(currentChunk);
          currentChunk = [];
        }
      }
      chunkHasA = true;
    }

    currentChunk.push(node);
  }
  if (currentChunk.length > 0) {
    cardChunks.push(currentChunk);
  }

  // 4. Process each chunk
  for (const chunk of cardChunks) {
    let qIndex = -1;
    let aIndex = -1;

    for (let i = 0; i < chunk.length; i++) {
        let nodeText = "";
        const nodePos = chunk[i].position;
        if (nodePos?.start?.offset !== undefined && nodePos?.end?.offset !== undefined) {
            nodeText = preprocessedText.substring(nodePos.start.offset, nodePos.end.offset);
        } else {
            nodeText = toString(chunk[i]);
        }
        
        if (qIndex === -1 && questionRegex.test(nodeText)) {
            qIndex = i;
        }
        if (aIndex === -1 && answerRegex.test(nodeText)) {
            aIndex = i;
        }
    }

    let frontNodes: MarkdownNode[] = [];
    let backNodes: MarkdownNode[] = [];

    if (qIndex !== -1 && aIndex !== -1) {
        if (qIndex < aIndex) {
            frontNodes = chunk.slice(0, aIndex); // Include from 0 so Card Separator is included
            backNodes = chunk.slice(aIndex);
        } else {
            backNodes = chunk.slice(aIndex, qIndex);
            frontNodes = chunk.slice(qIndex);
        }
    } else if (qIndex !== -1) {
        frontNodes = chunk.slice(0, qIndex + 1);
        backNodes = chunk.slice(qIndex + 1);
    } else if (aIndex !== -1) {
        frontNodes = chunk.slice(0, aIndex);
        backNodes = chunk.slice(aIndex);
    } else {
        if (chunk.length >= 2) {
            frontNodes = chunk.slice(0, 1);
            backNodes = chunk.slice(1);
        } else {
            continue; 
        }
    }

    if (frontNodes.length === 0 || backNodes.length === 0) continue;

    const nodesToMarkdown = (nodes: MarkdownNode[]) => {
      const start = nodes[0]?.position?.start?.offset;
      const end = nodes[nodes.length - 1]?.position?.end?.offset;

      if (typeof start === "number" && typeof end === "number" && end >= start) {
        return preprocessedText.substring(start, end).trim();
      }

      return nodes.map((node) => toString(node as any)).join("\n\n").trim();
    };

    let frontMd = nodesToMarkdown(frontNodes);
    let backMd = nodesToMarkdown(backNodes);

    if (!settings.includeQuestionMarker && qIndex !== -1) {
      const qMatch = frontMd.match(questionRegex);
      if (qMatch && qMatch[1] && qMatch[1].trim()) {
        frontMd = frontMd.replace(qMatch[0], qMatch[1]).trim();
      } else {
        frontMd = removeMarkerLines(frontMd, questionRegex).trim();
      }
    }

    if (!settings.includeAnswerMarker && aIndex !== -1) {
      const aMatch = backMd.match(answerRegex);
      if (aMatch && aMatch[1] && aMatch[1].trim()) {
        backMd = backMd.replace(aMatch[0], aMatch[1]).trim();
      } else {
        backMd = removeMarkerLines(backMd, answerRegex).trim();
      }
    }

    if (!settings.includeCardSeparatorMarker && bParts.length > 0) {
      const escapedBParts = bParts.map(s => escapeRegExp(s));
      const bPartsStr = escapedBParts.join("|");
      const cleanRegex = new RegExp(`^\\s*(?:[*+-]\\s+)?(?:#+\\s+)?(?:\\*\\*|__)?(?:${bPartsStr})\\s*(?:\\*\\*|__)?\\s*:?\\s*(?:\\*\\*|__)?\\s*`, "m");
      frontMd = frontMd.replace(cleanRegex, "").trim();
      backMd = backMd.replace(cleanRegex, "").trim();
    }

    if (frontMd && backMd) {
        cards.push({ front: frontMd, back: backMd });
    }
  }

  return cards;
}

interface SplitSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: SplitSettings;
  onConfirm: (settings: SplitSettings) => void;
  sampleText?: string;
}

export function SplitSettingsDialog({ open, onOpenChange, settings, onConfirm, sampleText = "" }: SplitSettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<SplitSettings>(settings);
  const [previewCards, setPreviewCards] = useState<FlashCard[]>([]);

  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
    }
  }, [open, settings]);

  useEffect(() => {
    if (!open) return;
    
    // Update preview when settings or text changes
    try {
      const cards = extractFlashcardsFromText(sampleText, localSettings);
      setPreviewCards(cards);
    } catch {
      setPreviewCards([]);
    }
  }, [localSettings, sampleText, open]);

  const handleReset = () => setLocalSettings(DEFAULT_SPLIT_SETTINGS);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-[90vw] h-[85vh] flex flex-col max-h-screen">
        <DialogHeader className="shrink-0">
          <DialogTitle>Configure Split Markers</DialogTitle>
          <DialogDescription>
            Definieren Sie, anhand welcher Marker der Text in Karten geteilt werden soll. Trennen Sie mehrere Möglichkeiten mit einem Komma.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_2fr] gap-6 py-2 flex-1 min-h-0">
          <div className="flex flex-col gap-5 overflow-y-auto pr-2 pb-2 scrollbar-thin">
            
            <div className="flex flex-col gap-2 p-3 bg-muted/30 border rounded-lg">
              <Label className="text-sm font-semibold text-primary">Predefined Formats</Label>
              <p className="text-xs text-muted-foreground mb-1">Select a matching hierarchy or edit to create a custom one.</p>
              <div className="flex flex-wrap gap-2">
                 {PREDEFINED_EXTRACTION_SETS.map((preset) => (
                    <Button 
                      key={preset.id}
                      variant="outline" 
                      size="sm"
                      className={`text-xs h-7 ${localSettings.id === preset.id ? 'border-primary bg-primary/10' : ''}`}
                      onClick={() => setLocalSettings(preset)}
                    >
                      {preset.name}
                    </Button>
                 ))}
                 <Button 
                    variant="outline" 
                    size="sm"
                    className={`text-xs h-7 ${!PREDEFINED_EXTRACTION_SETS.find(p => p.id === localSettings.id) ? 'border-primary bg-primary/10' : ''}`}
                    onClick={() => setLocalSettings({ ...localSettings, id: "custom", name: "Custom" })}
                  >
                    Custom
                  </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-1">
              <Label htmlFor="cardSeparators">Block / Card Separators</Label>
              <Textarea
                id="cardSeparators"
                value={localSettings.cardSeparators}
                onChange={e => setLocalSettings({ ...localSettings, cardSeparators: e.target.value, id: "custom", name: "Custom" })}
                placeholder="### Karte, ***, ---"
                rows={2}
              />
              <div className="flex items-center space-x-2 mt-1 mb-1">
                <Checkbox 
                  id="includeCardSeparatorMarker" 
                  checked={localSettings.includeCardSeparatorMarker}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, includeCardSeparatorMarker: !!checked })}
                />
                <Label htmlFor="includeCardSeparatorMarker" className="text-xs font-normal leading-none cursor-pointer">
                  Include matching text (marker) in front of card
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">e.g. Markdown lines separating individual flashcards.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="questionMarkers">Question Indicators</Label>
              <Textarea
                id="questionMarkers"
                value={localSettings.questionMarkers}
                onChange={e => setLocalSettings({ ...localSettings, questionMarkers: e.target.value, id: "custom", name: "Custom" })}
                placeholder="Frage:, Question:, Q:"
                rows={2}
              />
              <div className="flex items-center space-x-2 mt-1">
                <Checkbox 
                  id="includeQuestionMarker" 
                  checked={localSettings.includeQuestionMarker}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, includeQuestionMarker: !!checked })}
                />
                <Label htmlFor="includeQuestionMarker" className="text-xs font-normal leading-none cursor-pointer">
                  Include matching text (marker) in front of card
                </Label>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="answerMarkers">Answer Indicators</Label>
              <Textarea
                id="answerMarkers"
                value={localSettings.answerMarkers}
                onChange={e => setLocalSettings({ ...localSettings, answerMarkers: e.target.value, id: "custom", name: "Custom" })}
                placeholder="Antwort:, Answer:, A:"
                rows={2}
              />
              <div className="flex items-center space-x-2 mt-1">
                <Checkbox 
                  id="includeAnswerMarker" 
                  checked={localSettings.includeAnswerMarker}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, includeAnswerMarker: !!checked })}
                />
                <Label htmlFor="includeAnswerMarker" className="text-xs font-normal leading-none cursor-pointer">
                  Include matching text (marker) in back of card
                </Label>
              </div>
            </div>

            <div className="flex flex-col gap-2 py-2 mt-2 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="ignoreMarkerBrackets" 
                  checked={localSettings.ignoreMarkerBrackets}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, ignoreMarkerBrackets: !!checked })}
                />
                <Label htmlFor="ignoreMarkerBrackets" className="text-sm font-medium leading-none cursor-pointer">
                  Ignore Parenthetical Annotations inside Labels
                </Label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Intelligently strips out additions like <code>(Szenario / Fragestellung)</code> or <code>[Optional]</code> before the colon in markers. If your answers or questions have text in brackets directly following the marker, turning this off will keep them.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-l pl-6 overflow-hidden min-h-[300px]">
            <Label className="shrink-0 mb-1">Live Preview</Label>
            {sampleText.trim() === "" ? (
              <div className="flex flex-1 items-center justify-center bg-muted/20 border rounded-md text-sm text-muted-foreground p-8 text-center max-w-sm mx-auto">
                No sample text provided to preview.
              </div>
            ) : previewCards.length === 0 ? (
              <div className="flex flex-1 items-center justify-center bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive p-8 text-center max-w-sm mx-auto">
                No cards could be extracted with the current rules. Try adjusting the indicators on the left.
              </div>
            ) : (
              <Tabs defaultValue="markdown" className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center bg-background/95 backdrop-blur z-10 box-border border-b pb-2 mb-2 sticky top-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Extracted {previewCards.length} {previewCards.length === 1 ? 'card' : 'cards'}
                  </div>
                  <TabsList className="h-7 text-[10px]">
                    <TabsTrigger value="markdown" className="text-[10px] px-2 py-0.5">Rendered</TabsTrigger>
                    <TabsTrigger value="raw" className="text-[10px] px-2 py-0.5">Raw JSON</TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="flex flex-col flex-1 overflow-y-auto pr-3 scrollbar-thin rounded-md relative">
                  <TabsContent value="raw" className="m-0 mt-2 space-y-4">
                    {previewCards.slice(0, 15).map((card, idx) => (
                      <div key={idx} className="bg-muted/10 border border-border/80 shadow-sm rounded-lg p-4 text-sm flex flex-col gap-3 transition-colors hover:bg-muted/30">
                        <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                          <span className="font-semibold text-muted-foreground w-6 text-right">Q:</span>
                          <span className="break-words whitespace-pre-wrap leading-relaxed">{card.front}</span>
                        </div>
                        <div className="grid grid-cols-[auto_1fr] gap-3 items-start border-t pt-3">
                          <span className="font-semibold text-primary/80 w-6 text-right">A:</span>
                          <span className="break-words whitespace-pre-wrap leading-relaxed text-foreground/90">{card.back || (card as any).Back}</span>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="markdown" className="m-0 mt-2 space-y-4">
                    {previewCards.slice(0, 15).map((card, idx) => (
                      <div key={idx} className="bg-muted/10 border border-border/80 shadow-sm rounded-lg p-4 text-sm flex flex-col gap-3 transition-colors hover:bg-muted/30 prose prose-sm dark:prose-invert max-w-none">
                        <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                          <span className="font-semibold text-muted-foreground w-6 text-right mt-1">Q:</span>
                          <div className="break-words leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.front}</ReactMarkdown>
                          </div>
                        </div>
                        <div className="grid grid-cols-[auto_1fr] gap-3 items-start border-t border-border/80 pt-3">
                          <span className="font-semibold text-primary/80 w-6 text-right mt-1">A:</span>
                          <div className="break-words leading-relaxed opacity-90">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.back || (card as any).Back}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  {previewCards.length > 15 && (
                    <div className="text-xs text-muted-foreground text-center py-4 bg-muted/20 rounded-lg italic mt-2 shrink-0">
                      + {previewCards.length - 15} more cards not shown in preview...
                    </div>
                  )}
                </div>
              </Tabs>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-4 border-t mt-4">
          <Button variant="ghost" onClick={handleReset} type="button" className="text-muted-foreground hover:text-foreground">Reset Defaults</Button>
          <Button onClick={() => onConfirm(localSettings)} type="button" className="px-8 shadow">Save Settings & Extract</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
