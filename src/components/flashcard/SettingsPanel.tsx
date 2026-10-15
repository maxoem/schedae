import { useRef } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { DEFAULT_MARKDOWN_CSS } from './flashcard-utils';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  customCss: string;
  onCssChange: (css: string) => void;
}

export default function SettingsPanel({ isOpen, onClose, customCss, onCssChange }: SettingsPanelProps) {
  const cssTextareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 flex flex-col w-full max-w-md h-full bg-white border-l border-black shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/20 shrink-0">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Markdown-Stile</h2>
            <p className="text-xs text-muted-foreground mt-0.5">CSS-Regeln für die Darstellung von Karten</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-secondary/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-grow overflow-hidden flex flex-col px-6 py-4 gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CSS-Regeln</span>
            <button
              onClick={() => onCssChange(DEFAULT_MARKDOWN_CSS)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary/40"
            >
              <RotateCcw className="w-3 h-3" />
              Zurücksetzen
            </button>
          </div>
          <textarea
            ref={cssTextareaRef}
            value={customCss}
            onChange={(e) => onCssChange(e.target.value)}
            className="flex-grow w-full resize-none rounded-xl border border-border/60 bg-secondary/20 p-4 font-mono text-xs leading-relaxed text-foreground/90 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
            spellCheck={false}
            placeholder="/* CSS-Regeln hier eingeben */"
          />
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
            Änderungen werden automatisch gespeichert und sofort auf alle Kartenvorschauen angewendet.
          </p>
        </div>
      </div>
    </div>
  );
}
