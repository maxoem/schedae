import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { mockDecks, loadPublicDecksFromManifest, mergeDeckLists } from "@/data/decks";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Copy, Check, BookOpen, Sparkles, List, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LLM_FORMAT_INSTRUCTIONS } from "@/data/formatInstructions";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const getConceptFileForTopic = (topic: string): string => {
    const t = topic.toLowerCase();
    if (t.includes("math") || t.includes("analysis") || t.includes("stochastik")) return "Mathematik";
    if (t.includes("phil") || t.includes("epistemologie") || t.includes("ethik") || t.includes("wissenschaftstheorie")) return "Philosophie";
    if (t.includes("informatik") || t.includes("algorithmen")) return "Informatik";
    return topic;
};

const KNOWN_CONCEPT_TOPICS = ["Philosophie", "Mathematik", "Informatik"];

export default function Kartenkonzept() {
    const [allDecks, setAllDecks] = useState<any[]>(mockDecks);

    useEffect(() => {
        loadPublicDecksFromManifest().then((publicDecks) => {
            if (publicDecks.length > 0) {
                setAllDecks((prev) => mergeDeckLists(prev, publicDecks));
            }
        });
    }, []);

    const uniqueTopics = useMemo(() => {
        const fromDecks = allDecks.map((d) => d.topic).filter(Boolean);
        return Array.from(new Set([...KNOWN_CONCEPT_TOPICS, ...fromDecks]));
    }, [allDecks]);

    const [activeTopic, setActiveTopic] = useState<string>("Philosophie");
    const [activeSection, setActiveSection] = useState<string | null>();
    const [sections, setSections] = useState<{ id: string; title: string; bodyMd: string; level: number }[]>([]);
    const [rawMarkdown, setRawMarkdown] = useState<string>("");
    const observersRef = useRef<IntersectionObserver | null>(null);

// Fetch and parse markdown for the currently active topic
    useEffect(() => {
        let cancelled = false;

        const load = async (topic: string) => {
            try {
                const conceptFile = getConceptFileForTopic(topic);
                const path = `/konzepte/${encodeURIComponent(conceptFile)}.md`;
                const res = await fetch(path);
                if (!res.ok) throw new Error(`Failed to load ${path}`);
                const md = await res.text();
                
                if (!cancelled) setRawMarkdown(md);

                const lines = md.split(/\r?\n/);
                const out: { id: string; title: string; bodyMd: string; level: number }[] = [];
                const idCounts = new Map<string, number>();
                
                const makeId = (text: string) => {
                    const base = text
                        .trim()
                        .toLowerCase()
                        .replace(/[^\w\s-]/g, "")
                        .replace(/\s+/g, "-") || "heading";
                    const seen = idCounts.get(base) ?? 0;
                    idCounts.set(base, seen + 1);
                    return seen === 0 ? base : `${base}-${seen}`;
                };

                // Initialize immediately to capture any text before the first heading
                let current: { id: string; title: string; bodyLines: string[]; level: number } = {
                    id: "intro",
                    title: "Einleitung",
                    bodyLines: [],
                    level: 2 // Default to h2 for intro
                };

                for (const line of lines) {
                    // Match h1 (#), h2 (##), or h3 (###)
                    const m = line.match(/^(#{1,3})\s+(.*)$/);
                    if (m) {
                        // Push the previous section if it contains text or isn't the empty default
                        if (current.bodyLines.length > 0 || current.id !== "intro") {
                            out.push({ 
                                id: current.id, 
                                title: current.title, 
                                bodyMd: current.bodyLines.join("\n"),
                                level: current.level
                            });
                        }
                        const hashes = m[1];
                        const title = m[2].trim();
                        current = { id: makeId(title), title, bodyLines: [], level: hashes.length + 1 };
                    } else {
                        // Safely capture all standard text
                        current.bodyLines.push(line);
                    }
                }
                
                // Push the final section after the loop ends
                if (current.bodyLines.length > 0 || current.id !== "intro") {
                    out.push({ 
                        id: current.id, 
                        title: current.title, 
                        bodyMd: current.bodyLines.join("\n"),
                        level: current.level
                    });
                }

                if (!cancelled) {
                    setSections(out.length ? out : [{ id: "content", title: topic, bodyMd: md, level: 2 }]);
                }
            } catch (e) {
                console.error(e);
                if (!cancelled) {
                    setSections([{ 
                        level: 0,
                        id: "error", 
                        title: "Fehler", 
                        bodyMd: `Fehler beim Laden des Inhalts für ${topic}.` 
                    }]);
                }
            }
        };

        load(activeTopic);

        return () => {
            cancelled = true;
        };
    }, [activeTopic]);

    useEffect(() => {
        // IntersectionObserver to highlight active section
        const headingEls = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];

        if (observersRef.current) observersRef.current.disconnect();

        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActiveSection(entry.target.id);
                });
            },
            { root: null, rootMargin: "-20% 0px -60% 0px", threshold: 0 }
        );

        headingEls.forEach((el) => obs.observe(el));
        observersRef.current = obs;

        return () => obs.disconnect();
    }, [sections]);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const [copied, setCopied] = useState(false);
    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(rawMarkdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [rawMarkdown]);

    const [copiedFormat, setCopiedFormat] = useState(false);
    const handleCopyFormatInstructions = useCallback(() => {
        navigator.clipboard.writeText(LLM_FORMAT_INSTRUCTIONS);
        setCopiedFormat(true);
        setTimeout(() => setCopiedFormat(false), 2000);
    }, []);

    return (
        <div className="relative min-h-screen flex flex-col pt-8 pb-12 px-4 md:px-8 max-w-5xl mx-auto w-full">
            <div className="pointer-events-none fixed inset-0 -z-10 bg-grid" />

            {/* ── Header ────────────────────────────────────── */}
            <header className="mb-6 flex flex-col gap-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/">Home</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-medium text-primary">Academic Concepts</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Academic Concepts</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Domain-specific blueprints and rulesets for generating high-quality scientific flashcards.
                        </p>
                    </div>
                </div>
            </header>

            <Tabs value={activeTopic} className="w-full flex-1 flex flex-col" onValueChange={setActiveTopic}>
                {/* Top horizontal category bar */}
                <div className="overflow-x-auto pb-1 mb-6 scrollbar-hide shrink-0">
                    <TabsList className="h-auto p-1 rounded-full inline-flex border bg-muted/30 shadow-sm">
                        {uniqueTopics.map(topic => (
                            <TabsTrigger
                                key={topic}
                                value={topic}
                                className="capitalize px-6 py-2.5 rounded-full text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                            >
                                {topic}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* ── Main Workspace ────────────────────────────────────── */}
                <main className="flex-1 grid grid-cols-1 lg:grid-cols-[2.5fr_1fr] gap-6 items-start">
                    
                    {/* LEFT PANE: Document Viewer */}
                    <div className="flex flex-col border rounded-xl overflow-hidden bg-card shadow-sm relative col-span-1 min-h-[600px]">
                        <div className="bg-muted px-4 py-3 border-b flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                <span className="text-sm font-semibold uppercase tracking-wider text-primary/80">{activeTopic} Blueprint</span>
                            </div>
                            <Badge variant="outline" className="text-xs bg-background/50 leading-none py-1 border-primary/20 text-primary">Read Only</Badge>
                        </div>
                        
                        <div className="flex-1 w-full bg-transparent overflow-y-auto max-h-[85vh] scrollbar-thin">
                            <div className="p-6 md:p-8 text-foreground/90">
                                {sections.map((s) => (
                                    <article key={s.id} id={s.id} className="mb-8 last:mb-0">
                                        <h3 className="text-2xl font-bold mb-4 text-foreground tracking-tight">{s.title}</h3>
                                        <div className="prose prose-zinc max-w-none prose-headings:font-bold prose-headings:text-zinc-900 prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2 prose-p:text-zinc-700 prose-p:leading-relaxed prose-ul:list-disc prose-ul:pl-6 prose-li:my-1 marker:prose-li:text-zinc-500 [&_.katex-display]:my-6">
                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                {s.bodyMd}
                                            </ReactMarkdown>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANE: Meta & Actions */}
                    <div className="flex flex-col gap-6 sticky top-6">
                        
                        {/* Action Card */}
                        <div className="flex flex-col border rounded-xl overflow-hidden bg-card shadow-sm">
                            <div className="bg-muted px-4 py-3 border-b flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold uppercase tracking-wider text-primary/80">Prompt Integration</span>
                                </div>
                            </div>
                            <div className="p-5 flex flex-col gap-4 bg-background">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Copy this entire concept blueprint and paste it into your Master Prompt inside the LLM to strictly enforce these domain rules for card generation.
                                </p>
                                <Button 
                                    size="lg"
                                    onClick={handleCopy}
                                    className="w-full gap-2 border-primary bg-primary/95 hover:bg-primary shadow-sm"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-emerald-300" />
                                            <span>Blueprint Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            <span>Copy Blueprint Concept</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Format Instructions Card */}
                        <div className="flex flex-col border rounded-xl overflow-hidden bg-card shadow-sm">
                            <div className="bg-muted px-4 py-3 border-b flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <FileCode2 className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold uppercase tracking-wider text-primary/80">LLM Output Format</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/20 text-primary">Parser-Ready</Badge>
                            </div>
                            <div className="p-5 flex flex-col gap-3 bg-background">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Copy prompt instructions that instruct your LLM on how to format cards with Questions, Answers, and Custom Fields for seamless parsing in the workspace.
                                </p>
                                <Button 
                                    size="default"
                                    variant="outline"
                                    onClick={handleCopyFormatInstructions}
                                    className="w-full gap-2 border-border shadow-2xs hover:bg-muted"
                                >
                                    {copiedFormat ? (
                                        <>
                                            <Check className="w-4 h-4 text-emerald-500" />
                                            <span>Format Instructions Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 text-muted-foreground" />
                                            <span>Copy Format Instructions</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* TOC Card */}
                        <div className="flex flex-col border rounded-xl overflow-hidden bg-card shadow-sm">
                            <div className="bg-muted px-4 py-3 border-b flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <List className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contents</span>
                                </div>
                            </div>
                            <div className="p-3 flex flex-col gap-1 bg-background/50 max-h-[350px] overflow-y-auto scrollbar-thin">
                                {sections.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => scrollTo(s.id)}
                                        style={{ marginLeft: `${(s.level - 2) * 0.75}rem` }}
                                        className={`text-left px-3 py-2 rounded-md text-sm transition-all ${
                                            activeSection === s.id
                                            ? "bg-primary/10 text-primary font-semibold"
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        }`}
                                    >
                                        {s.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </main>
            </Tabs>
        </div>
    );
}