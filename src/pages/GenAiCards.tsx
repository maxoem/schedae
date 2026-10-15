import { Link } from "react-router-dom";
import { Copy, Check, ArrowRight, Sparkles, FileJson, Palette, Type, List, Code, Lightbulb, BookOpen, Layers, RefreshCw, Braces, FileText, Repeat, Lock, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LLM_FORMAT_INSTRUCTIONS } from "@/data/formatInstructions";
import { Card, CardContent } from "@/components/ui/card";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Examples and Content
// ---------------------------------------------------------------------------

const PROMPT_EXAMPLE = `You will act as an expert and professor in mathematical and computer science didactics. Your task is to transform the provided source text into flashcards. You must apply the conceptual framework of the "Procedural Learning Systematics" that has been provided to you in the context.

Execute the task strictly according to the following protocol:

<thinking_process>
Execute this step exclusively in ENGLISH. Use this block to plan your analysis before generating the flashcards.
1. Concept Extraction: Identify the central concepts in the text. Ask yourself: what is relevant for someone in this area-of-study to understand and remember?
2. Classification and type Determination: Evaluate the best approach to create each card, given your knowledge and context.
3. Card Creation: Answer the questions:
    - What scope should each card cover?
    - Should they be split?
    - How is the information best presented?
   Then craft the card.
</thinking_process>

<output_generation>
Now generate the final flashcards in precise, academic German.
- Format the cards intelligently. Use the possibilities of markdown. 
- Use the following structure:

# Card {No. A}
## Question
[Precise question asking for the formal definition/structure]
## Answer
[Rigorous mathematical/algorithmic answer]

</output_generation>

Here is the source text you are to analyze:
[INSERT TEXT HERE]`;

const LLM_MD_PROMPT_EXAMPLE = `Du bist ein fachdidaktischer Experte. Ich habe ein bestehendes Anki-Deck im LLM-MD Format exportiert.
Aufgabe: Überarbeite die folgenden Karten auf wissenschaftliche Präzision, bessere Lesbarkeit und klare Formatierung.

Regeln:
1. Lass die Card-IDs (z.B. ### 12345 oder ### deck:12345) UNVERÄNDERT.
2. Behalte die Struktur mit Q: und A: bei.
3. Verwende wo sinnvoll KaTeX-Mathematik ($...$ oder $$...$$) und Markdown.
4. Falls eine Karte irrelevant ist, ersetze den Inhalt mit [DELETE].

Hier sind die Karten im LLM-MD Format:
[LLM-MD INHALT HIER EINFÜGEN]`;

const BASE_JSON = `[
  {
    "front": "Question or Keyword (Front of the card)",
    "back": "Answer or Explanation (Back of the card)"
  },
  {
    "front": "Second Card - Question",
    "back": "Second Card - Answer"
  }
]`;

const ADVANCED_JSON = `{
  "cards": [
    {
      "front": "Question",
      "back": "Answer"
    }
  ],
  "style": ".card { font-family: arial; text-align: center; background-color: white; }"
}`;

// ---------------------------------------------------------------------------
// Copy Button Component
// ---------------------------------------------------------------------------

function CopyableCode({ code, title = "Prompt" }: { code: string, title?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [code]);

    return (
        <div className="relative flex w-full min-w-0 flex-col rounded-xl border bg-zinc-950 text-zinc-50 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                    </div>
                    <span className="ml-2 text-xs font-medium text-zinc-400 font-mono">{title}</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex flex-row items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded-md"
                    title="Copy to clipboard"
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy code</span>
                        </>
                    )}
                </button>
            </div>
            <div className="p-4 overflow-x-auto">
                <pre className="text-[13px] leading-relaxed font-mono whitespace-pre-wrap break-words">
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function GenAiCards() {
    return (
        <div className="relative min-h-screen flex flex-col pt-8 pb-12 px-4 md:px-8 max-w-5xl mx-auto w-full">
            <div className="pointer-events-none fixed inset-0 -z-10 bg-grid" />
            <div className="flex flex-col gap-8">
                {/* ── Breadcrumb ──────────────────────────────────────────────── */}
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/">Home</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-medium">LLM Guide</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* ── Hero ────────────────────────────────────────────────────── */}
                <header className="mb-2 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-100/80 text-zinc-900 shadow-2xs">
                                <Sparkles className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">LLM Guide & Prompting</h1>
                                <p className="text-base text-muted-foreground max-w-2xl leading-relaxed mt-1">
                                    Didactic AI pipelines for generating scientific flashcards and lossless Anki deck refinement via LLM-MD.
                                </p>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 font-medium">
                                    <Lock className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                                    <span>Runs 100% locally in your browser · No external server uploads</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── Two Core Pipelines ───────────────────────────────────────── */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-foreground">
                            <Layers className="w-5 h-5 text-zinc-600" /> Didactic AI Pipelines
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pipeline A: Generation */}
                        <div className="flex flex-col justify-between rounded-xl bg-card border border-zinc-200 p-6 shadow-2xs relative overflow-hidden">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="bg-zinc-100 text-zinc-800 border-zinc-300">Pipeline A</Badge>
                                    <Sparkles className="w-4 h-4 text-zinc-500" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">New Deck Generation (PDF / Source → Anki)</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Transform raw academic lecture notes, papers, or PDFs into structured flashcards using domain didactics.
                                </p>
                                <ol className="space-y-2 text-xs text-zinc-700 font-medium">
                                    <li className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold text-[11px] border">1</span>
                                        Select Academic Blueprint (<Link to="/kartenkonzept" className="underline hover:text-zinc-900">Konzepte</Link>)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold text-[11px] border">2</span>
                                        Run Master Prompt with source text in any LLM
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold text-[11px] border">3</span>
                                        Compile output to APKG (<Link to="/json-to-apkg" className="underline hover:text-zinc-900">MD & JSON to APKG</Link>)
                                    </li>
                                </ol>
                            </div>
                            <div className="mt-6 pt-4 border-t border-zinc-100">
                                <Button asChild variant="outline" className="w-full gap-2 text-xs h-9">
                                    <Link to="/json-to-apkg">
                                        <Layers className="w-3.5 h-3.5" /> Launch Deck Compiler <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Pipeline B: Refinement Roundtrip */}
                        <div className="flex flex-col justify-between rounded-xl bg-card border border-zinc-200 p-6 shadow-2xs relative overflow-hidden">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="bg-zinc-100 text-zinc-800 border-zinc-300">Pipeline B (LLM-MD Roundtrip)</Badge>
                                    <Repeat className="w-4 h-4 text-zinc-500" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Deck Refinement (APKG → LLM-MD → APKG)</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Export an existing Anki `.apkg` file to LLM-MD format, refine cards with ChatGPT/Claude, and merge back preserving all Anki note IDs and scheduling.
                                </p>
                                <ol className="space-y-2 text-xs text-zinc-700 font-medium">
                                    <li className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold text-[11px] border">1</span>
                                        Export APKG to LLM-MD (<Link to="/configure" className="underline hover:text-zinc-900">APKG to MD/JSON</Link>)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold text-[11px] border">2</span>
                                        Let LLM improve clarity, add KaTeX, or fix typos
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold text-[11px] border">3</span>
                                        Re-map LLM output via Merge Assistant (<Link to="/llm-merge" className="underline hover:text-zinc-900">LLM Merge</Link>)
                                    </li>
                                </ol>
                            </div>
                            <div className="mt-6 pt-4 border-t border-zinc-100 flex gap-2">
                                <Button asChild variant="outline" className="flex-1 gap-1.5 text-xs h-9">
                                    <Link to="/configure">
                                        <RefreshCw className="w-3.5 h-3.5" /> 1. Extract APKG
                                    </Link>
                                </Button>
                                <Button asChild variant="secondary" className="flex-1 gap-1.5 text-xs h-9 font-medium">
                                    <Link to="/llm-merge">
                                        <Braces className="w-3.5 h-3.5" /> 2. LLM Merge
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Main Workspace ────────────────────────────────────── */}
                <main className="flex-1 min-w-0">
                    <div className="flex min-w-0 flex-col gap-10">

                        {/* ── Output Format Instructions (Parser-Ready Markdown & Custom Fields) ──────── */}
                        <section className="bg-card border-2 border-primary/20 rounded-xl overflow-hidden shadow-2xs min-w-0">
                            <div className="bg-primary/5 px-4 py-3 border-b border-primary/15 flex justify-between items-center">
                                <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                                    <FileCode2 className="w-4 h-4 text-primary" />
                                    <span>Output Format Instructions (Markdown & Custom Fields)</span>
                                </div>
                                <Badge variant="outline" className="text-xs bg-background leading-none py-1 border-primary/30 text-primary">Parser Compatible</Badge>
                            </div>
                            <div className="p-5 sm:p-6">
                                <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed">
                                    Copy these instructions into any LLM prompt to instruct the model to produce clean, parser-ready flashcards. Schedae automatically extracts questions, answers, and any custom fields (such as <code className="text-xs bg-muted px-1 py-0.5 rounded">### Notes</code> or <code className="text-xs bg-muted px-1 py-0.5 rounded">### Sources</code>) directly into Anki fields.
                                </p>
                                <CopyableCode code={LLM_FORMAT_INSTRUCTIONS} title="format_instructions.txt" />
                            </div>
                        </section>
                        
                        {/* ── Master Prompt for Generation ─────────────────────────────────────────── */}
                        <section className="bg-card border rounded-xl overflow-hidden shadow-2xs min-w-0">
                            <div className="bg-muted/50 px-4 py-3 border-b flex justify-between items-center">
                                <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                                    <Code className="w-4 h-4 text-zinc-600" />
                                    Master Prompt (Pipeline A: New Deck Generation)
                                </div>
                                <Badge variant="outline" className="text-xs bg-background leading-none py-1">Standardized Didactics</Badge>
                            </div>
                            <div className="p-5 sm:p-6">
                                <p className="text-xs sm:text-sm text-muted-foreground mb-5 leading-relaxed">
                                    Copy this prompt into your LLM (ChatGPT, Claude, Gemini, or local models). Insert your selected <strong>academic blueprint</strong> and your <strong>source material text</strong>.
                                </p>
                                <CopyableCode code={PROMPT_EXAMPLE} title="generation_prompt.txt" />
                            </div>
                        </section>

                        {/* ── LLM-MD Refinement Prompt ─────────────────────────────────────────── */}
                        <section className="bg-card border rounded-xl overflow-hidden shadow-2xs min-w-0">
                            <div className="bg-muted/50 px-4 py-3 border-b flex justify-between items-center">
                                <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                                    <Repeat className="w-4 h-4 text-zinc-600" />
                                    LLM-MD Refinement Prompt (Pipeline B: Deck Overhaul)
                                </div>
                                <Badge variant="outline" className="text-xs bg-background leading-none py-1">Preserves Note IDs</Badge>
                            </div>
                            <div className="p-5 sm:p-6">
                                <p className="text-xs sm:text-sm text-muted-foreground mb-5 leading-relaxed">
                                    Use this prompt when refining an existing deck exported in <strong>LLM-MD format</strong> (<Link to="/configure" className="underline hover:text-foreground font-medium">APKG to MD/JSON</Link>).
                                </p>
                                <CopyableCode code={LLM_MD_PROMPT_EXAMPLE} title="refinement_prompt.txt" />
                            </div>
                        </section>

                        {/* ── JSON Structure ──────────────────────────────────────────── */}
                        <section className="space-y-6 min-w-0">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight mb-2 flex items-center gap-2 text-foreground">
                                    <FileJson className="w-5 h-5 text-zinc-600" /> Programmatic & JSON Schemas
                                </h2>
                                <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                                    The Deck Compiler automatically extracts markdown Q&A cards without requiring strict JSON. However, if your automated pipeline outputs JSON directly, the following schemas are natively supported:
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
                                {/* Base Format */}
                                <div className="flex min-w-0 flex-col bg-card border rounded-xl overflow-hidden shadow-2xs">
                                    <div className="bg-muted/50 px-4 py-3 flex justify-between items-center border-b">
                                        <div className="flex items-center gap-2 text-foreground font-semibold text-xs uppercase tracking-wider">
                                            <FileJson className="w-3.5 h-3.5 text-zinc-500" />
                                            Base Array Format
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1">
                                        <p className="text-xs text-muted-foreground mb-3">Simple JSON array of card objects with <code>front</code> and <code>back</code> keys.</p>
                                        <CopyableCode code={BASE_JSON} title="basic-deck.json" />
                                    </div>
                                </div>

                                {/* Advanced Format */}
                                <div className="flex min-w-0 flex-col bg-card border rounded-xl overflow-hidden shadow-2xs">
                                    <div className="bg-muted/50 px-4 py-3 flex justify-between items-center border-b">
                                        <div className="flex items-center gap-2 text-foreground font-semibold text-xs uppercase tracking-wider">
                                            <Palette className="w-3.5 h-3.5 text-zinc-500" />
                                            Advanced Payload (Custom CSS)
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">Anki Styles</Badge>
                                    </div>
                                    <div className="p-4 flex-1">
                                        <p className="text-xs text-muted-foreground mb-3">Enclose in a <code>cards</code> array to bundle a custom global CSS <code>style</code> block.</p>
                                        <CopyableCode code={ADVANCED_JSON} title="advanced.json" />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Content Formatting Grid */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                            <Card className="border-zinc-200 shadow-2xs bg-card rounded-xl h-full">
                                <CardContent className="p-6">
                                    <h3 className="font-bold text-base mb-4 text-foreground">Supported Markup Syntax</h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3">
                                            <div className="mt-0.5 p-1.5 bg-muted rounded-md text-foreground"><Type className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-sm font-semibold">Standard Markdown</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Use *italics*, **bold**, and inline `code` blocks seamlessly.</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-0.5 p-1.5 bg-muted rounded-md text-foreground"><List className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-sm font-semibold">LaTeX Mathematics</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Wrap formulas with <code>$inline$</code> or <code>$$display$$</code> math environments.</p>
                                            </div>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-zinc-200 bg-zinc-50/50 shadow-2xs relative overflow-hidden rounded-xl h-full">
                                <CardContent className="p-6 flex flex-col justify-center h-full relative z-10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-2 bg-zinc-200/80 text-zinc-800 rounded-lg"><Lightbulb className="w-4 h-4" /></div>
                                        <span className="font-bold text-base text-foreground">Academic Blueprints</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                                        Quality flashcards require rigorous domain didactics. Consult our open domain blueprints before prompting.
                                    </p>
                                    <Button asChild variant="outline" className="w-fit shadow-2xs mt-auto text-xs h-9">
                                        <Link to="/kartenkonzept">
                                            Browse Academic Blueprints <ArrowRight className="w-4 h-4 ml-2" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Navigation Context */}
                        <section className="border rounded-xl bg-card shadow-2xs p-5">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                <Layers className="w-4 h-4" /> System Quick Links
                            </h3>
                            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Link to="/kartenkonzept" className="group flex items-center p-2 rounded-md hover:bg-muted transition-colors text-xs font-medium text-foreground">
                                    <div className="p-1.5 bg-background border shadow-2xs rounded mr-3 text-muted-foreground group-hover:text-foreground transition-colors"><BookOpen className="w-3.5 h-3.5" /></div>
                                    Academic Concept Blueprints
                                </Link>
                                <Link to="/" className="group flex items-center p-2 rounded-md hover:bg-muted transition-colors text-xs font-medium text-foreground">
                                    <div className="p-1.5 bg-background border shadow-2xs rounded mr-3 text-muted-foreground group-hover:text-foreground transition-colors"><Layers className="w-3.5 h-3.5" /></div>
                                    Public Scientific Decks
                                </Link>
                            </nav>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
