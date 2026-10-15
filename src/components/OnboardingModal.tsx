import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Binary, 
  Terminal, 
  Cpu, 
  BookMarked, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  ExternalLink,
  ShieldCheck,
  Check,
  CornerDownRight
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

export const ONBOARDING_STORAGE_KEY = "schedae-onboarding-completed-v1";

export function resetOnboarding() {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface ComponentFeature {
  title: string;
  desc: string;
}

interface ComponentDoc {
  section: string;
  tag: string;
  title: string;
  icon: typeof Terminal;
  description: string;
  features: ComponentFeature[];
  link?: string;
  linkText?: string;
}

const DOCUMENTATION_SECTIONS: ComponentDoc[] = [
  {
    section: "01",
    tag: "Core Pipeline",
    title: "MD & JSON to APKG Compiler",
    icon: Terminal,
    description: "Create ready-to-study Anki decks directly from Markdown notes or structured JSON — fast, 100% offline, and formatted.",
    features: [
      {
        title: "100% Client-Side",
        desc: "Compilation runs entirely in the browser via WebAssembly (sql.js) — no servers, zero telemetry.",
      },
      {
        title: "LaTeX & Syntax Highlighting",
        desc: "Native formula rendering with KaTeX and syntax highlighting for over 40 programming languages.",
      },
      {
        title: "Flexible Parser Rules",
        desc: "Supports Q&A patterns, definition lists, tables, and structured JSON formats.",
      },
    ],
    link: "/json-to-apkg",
    linkText: "Open Compiler",
  },
  {
    section: "02",
    tag: "Reverse Engineering",
    title: "APKG Decompiler & Normalizer",
    icon: Binary,
    description: "Decompile existing Anki decks back into clean Markdown or JSON for Obsidian, Logseq, or AI workflows.",
    features: [
      {
        title: "Direct SQLite Parsing",
        desc: "Reads proprietary Anki .apkg archives directly in browser memory.",
      },
      {
        title: "Deterministic IDs",
        desc: "Preserves unique card GUIDs for reliable re-importing and version control.",
      },
      {
        title: "Clean Markdown Export",
        desc: "Separates didactic content from Anki scheduling metadata for portable notes.",
      },
    ],
    link: "/configure",
    linkText: "Launch Decompiler",
  },
  {
    section: "03",
    tag: "AI & Synthesis",
    title: "LLM Guide & Merge Assistant",
    icon: Sparkles,
    description: "Refine your flashcards with AI prompts without discarding your Anki algorithm's learning progress.",
    features: [
      {
        title: "Lossless ID Merge",
        desc: "Remaps revised card text accurately back to existing Anki cards — preserving your scheduling intervals.",
      },
      {
        title: "Academic Prompt Templates",
        desc: "Specialized system prompts designed for rigorous university and STEM topics.",
      },
      {
        title: "Local & Cloud Models",
        desc: "Compatible with local models (Ollama, LM Studio) for complete privacy as well as standard REST APIs.",
      },
    ],
    link: "/genai-cards",
    linkText: "View LLM Guide",
  },
  {
    section: "04",
    tag: "Didactics & Structure",
    title: "Card Concepts & Blueprints",
    icon: Cpu,
    description: "Structured schemas against superficial rote learning — built for deep understanding and conceptual transfer.",
    features: [
      {
        title: "Formal Schemas",
        desc: "Templates for formal disciplines: Definition, Theorem, Proof Idea, Intuition, and Counterexample.",
      },
      {
        title: "Prevents Illusions of Competence",
        desc: "Card structure fosters genuine concept comprehension over mere recognition.",
      },
      {
        title: "Ready to Use",
        desc: "Copy directly as templates or use as system prompts for LLMs.",
      },
    ],
    link: "/kartenkonzept",
    linkText: "Explore Concepts",
  },
  {
    section: "05",
    tag: "Open Knowledge",
    title: "Curated Knowledge Stacks",
    icon: BookMarked,
    description: "Freely accessible, academically curated reference card decks with full LaTeX and math formula integration.",
    features: [
      {
        title: "High-Quality Academic Stacks",
        desc: "Curated decks for Philosophy of Science, Formal Semantics, Logic, and more.",
      },
      {
        title: "Interactive Preview",
        desc: "Browse cards in the browser with full formula rendering before downloading.",
      },
      {
        title: "1-Click .apkg Download",
        desc: "Open Educational Resource (OER): Download decks directly or customize them freely.",
      },
    ],
    link: "/decks",
    linkText: "Browse Stacks",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const hasTourParam = searchParams.get("tour") === "true" || searchParams.get("onboarding") === "true";
    if (hasTourParam) {
      setOpen(true);
      setCurrentSection(0);
      return;
    }

    try {
      const seen = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!seen) {
        setOpen(true);
      }
    } catch {
      // Fallback
    }
  }, [searchParams]);

  const handleClose = useCallback((targetLink?: string) => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setOpen(false);

    if (searchParams.get("tour") || searchParams.get("onboarding")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("tour");
      nextParams.delete("onboarding");
      setSearchParams(nextParams, { replace: true });
    }

    if (targetLink) {
      navigate(targetLink);
    }
  }, [navigate, searchParams, setSearchParams]);

  const handleNext = useCallback(() => {
    if (currentSection < DOCUMENTATION_SECTIONS.length - 1) {
      setCurrentSection((prev) => prev + 1);
    } else {
      handleClose();
    }
  }, [currentSection, handleClose]);

  const handlePrev = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
    }
  }, [currentSection]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleNext, handlePrev]);

  const doc = DOCUMENTATION_SECTIONS[currentSection];
  const DocIcon = doc.icon;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        handleClose();
      } else {
        setOpen(true);
      }
    }}>
      <DialogContent className="fixed inset-0 m-auto top-0 left-0 right-0 bottom-0 translate-x-0 translate-y-0 transform-none data-[state=open]:zoom-in-100 sm:max-w-3xl max-h-[85vh] h-fit p-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl flex flex-col font-sans antialiased">
        
        {/* Academic / Technical Header Bar */}
        <div className="px-6 py-3.5 border-b border-border bg-muted/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold tracking-wider uppercase text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-foreground inline-block" />
              SCHEDAE // SYSTEM ARCHITECTURE & MANUAL
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-muted-foreground border-l border-border pl-3">
              Open-Source Anki Compiler Toolchain
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
              v1.0.0
            </span>
          </div>
        </div>

        {/* Split-View: Index on Left, Documentation on Right */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[400px]">
          
          {/* Index Sidebar */}
          <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-border bg-muted/20 p-3 sm:p-4 overflow-y-auto shrink-0 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3 px-2 font-medium">
                Module Index
              </div>

              <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
                {DOCUMENTATION_SECTIONS.map((item, idx) => {
                  const isActive = idx === currentSection;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSection(idx)}
                      className={`text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-between group shrink-0 ${
                        isActive
                          ? "bg-accent text-accent-foreground font-semibold border border-border shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {item.section}
                        </span>
                        <span className="truncate">{item.title.split("(")[0].trim()}</span>
                      </div>
                      {isActive && (
                        <CornerDownRight className="w-3.5 h-3.5 text-foreground shrink-0 hidden md:block" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Offline & Architecture Notice in Sidebar */}
            <div className="hidden md:block pt-4 border-t border-border px-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium text-foreground mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Client-Side Execution</span>
              </div>
              <p className="leading-relaxed text-[11px] text-muted-foreground">
                100% local execution in browser (WASM / SQLite). No storage, zero telemetry.
              </p>
            </div>
          </aside>

          {/* Main Manual Body */}
          <main className="flex-1 p-6 sm:p-7 overflow-y-auto bg-card flex flex-col justify-between">
            <div className="space-y-5">
              {/* Section Header */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs text-primary font-semibold tracking-wide">
                    Module {doc.section}
                  </span>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                    {doc.tag}
                  </span>
                </div>

                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                  <DocIcon className="w-5 h-5 text-muted-foreground stroke-[1.75]" />
                  <span>{doc.title}</span>
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {doc.description}
                </DialogDescription>

                {/* Short, crisp overview - NO nested box */}
                <p className="text-sm text-muted-foreground leading-relaxed mt-2.5">
                  {doc.description}
                </p>
              </div>

              {/* Key Features & Properties */}
              <div className="space-y-3 pt-1">
                <div className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Key Features & Highlights
                </div>
                <ul className="space-y-2.5">
                  {doc.features.map((feature, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-foreground flex items-start gap-2.5 leading-relaxed">
                      <span className="font-mono text-xs font-semibold text-primary/80 select-none shrink-0 mt-0.5">
                        [{idx + 1}]
                      </span>
                      <div>
                        <strong className="font-medium text-foreground">{feature.title}: </strong>
                        <span className="text-muted-foreground">{feature.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Direct Tool Jump Link */}
            {doc.link && (
              <div className="pt-4 mt-6 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Would you like to open this module now?
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClose(doc.link)}
                  className="font-mono text-xs h-8 gap-1.5 hover:bg-accent font-medium"
                >
                  <span>{doc.linkText || "Open Module"}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </main>
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-6 py-3 bg-muted/30 border-t border-border flex items-center justify-between gap-4 text-xs shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleClose()}
            className="text-xs text-muted-foreground hover:text-foreground font-mono"
          >
            [Close / ESC]
          </Button>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block font-mono text-[11px] text-muted-foreground select-none">
              Navigation: ↑ / ↓ / Enter
            </span>

            {currentSection > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="text-xs gap-1.5 h-8 font-mono"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </Button>
            )}

            {currentSection < DOCUMENTATION_SECTIONS.length - 1 ? (
              <Button
                size="sm"
                onClick={handleNext}
                className="text-xs gap-1.5 h-8 font-mono"
              >
                Next Module ({DOCUMENTATION_SECTIONS[currentSection + 1].section})
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => handleClose()}
                className="text-xs gap-1.5 h-8 font-mono"
              >
                Finish Tour
                <Check className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
