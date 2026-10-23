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
export {
  type MarkdownNode,
  type SplitSettings,
  PREDEFINED_EXTRACTION_SETS,
  DEFAULT_SPLIT_SETTINGS,
  type HighlightMarkerPattern,
  _markerCssClass,
  buildSplitRegexes,
  buildHighlightPatterns,
  extractFlashcardsFromText,
} from "@/services/deckParser/splitSettings";
import {
  type SplitSettings,
  PREDEFINED_EXTRACTION_SETS,
  extractFlashcardsFromText,
} from "@/services/deckParser/splitSettings";

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
