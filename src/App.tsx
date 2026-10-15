import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "@/pages/Home";
import DeckDetail from "@/pages/DeckDetail";
import StackDetail from "@/pages/StackDetail";
import DeckConverter from "@/pages/DeckConverter";
import LlmMerge from "@/pages/LlmMerge";
import DeckRemaster from "@/pages/DeckRemaster";
import CreateDeck from "@/pages/CreateDeck";
import Kartenkonzept from "@/pages/Kartenkonzept";
import GenAiCards from "@/pages/GenAiCards";
import JsonToApkg from "@/pages/JsonToApkg";
import OpenSource from "@/pages/OpenSource";
import { OnboardingModal } from "@/components/OnboardingModal";
import { BookOpen, Sparkles, RefreshCcw, Layers, Lightbulb, Menu, Braces, Lock, Wand2, Replace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { useState } from "react";

function ToolSwitcher() {
  const location = useLocation();

  const isMdToApkg = location.pathname === "/" || location.pathname === "/json-to-apkg";
  const isApkgToMd = location.pathname === "/configure";
  const isMerge = location.pathname === "/llm-merge";
  const isRemaster = location.pathname === "/remaster" || location.pathname === "/refurbish";

  return (
    <nav aria-label="Tool Switcher" className="inline-flex items-center p-1 rounded-full bg-zinc-100 border border-zinc-200/90 shadow-2xs text-xs font-medium">
      <Link
        to="/"
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all ${
          isMdToApkg
            ? "bg-white text-zinc-950 font-semibold shadow-2xs"
            : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50"
        }`}
      >
        <Layers className={`w-3.5 h-3.5 ${isMdToApkg ? "text-zinc-950" : "text-zinc-500"}`} />
        <span>MD → APKG</span>
      </Link>

      <Link
        to="/configure"
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all ${
          isApkgToMd
            ? "bg-white text-zinc-950 font-semibold shadow-2xs"
            : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50"
        }`}
      >
        <RefreshCcw className={`w-3.5 h-3.5 ${isApkgToMd ? "text-zinc-950" : "text-zinc-500"}`} />
        <span>APKG → MD</span>
      </Link>

      <Link
        to="/llm-merge"
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all ${
          isMerge
            ? "bg-white text-zinc-950 font-semibold shadow-2xs"
            : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50"
        }`}
      >
        <Braces className={`w-3.5 h-3.5 ${isMerge ? "text-zinc-950" : "text-zinc-500"}`} />
        <span>Merge</span>
      </Link>

      <Link
        to="/remaster"
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all ${
          isRemaster
            ? "bg-white text-zinc-950 font-semibold shadow-2xs"
            : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50"
        }`}
      >
        <Replace className={`w-3.5 h-3.5 ${isRemaster ? "text-zinc-950" : "text-zinc-500"}`} />
        <span>Transform</span>
      </Link>
    </nav>
  );
}

function DesktopNav() {
  const location = useLocation();

  const isDecks =
    location.pathname === "/decks" ||
    location.pathname.startsWith("/deck/") ||
    location.pathname.startsWith("/stack/");
  const isConcepts = location.pathname === "/kartenkonzept";
  const isGuide = location.pathname === "/genai-cards";

  return (
    <div className="hidden md:flex items-center gap-1">
      <Link
        to="/decks"
        className={`px-3 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors ${
          isDecks
            ? "text-zinc-950 font-semibold bg-zinc-100/90"
            : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/60"
        }`}
      >
        Decks
      </Link>
      <Link
        to="/kartenkonzept"
        className={`px-3 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors ${
          isConcepts
            ? "text-zinc-950 font-semibold bg-zinc-100/90"
            : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/60"
        }`}
      >
        Concepts
      </Link>
      <Link
        to="/genai-cards"
        className={`px-3 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors ${
          isGuide
            ? "text-zinc-950 font-semibold bg-zinc-100/90"
            : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/60"
        }`}
      >
        Guide
      </Link>

      <div className="hidden xl:block h-4 w-px bg-zinc-200 mx-1.5" />

      <Button
        variant="ghost"
        size="sm"
        asChild
        className="hidden xl:inline-flex h-8 px-2.5 text-xs font-medium text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100"
      >
        <Link to="?tour=true" className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <span>Tour</span>
        </Link>
      </Button>
    </div>
  );
}

function MobileNav() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center md:hidden gap-2">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9">
            <Menu className="w-5 h-5 text-zinc-700" />
            <span className="sr-only">Open Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[82vw] sm:w-[350px]">
          <SheetHeader>
            <SheetTitle className="text-left font-bold text-lg">Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-5 mt-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                Tools
              </p>
              <nav className="flex flex-col gap-1">
                <Button
                  variant={location.pathname === "/" || location.pathname === "/json-to-apkg" ? "secondary" : "ghost"}
                  asChild
                  className="justify-start h-9 text-sm font-medium"
                >
                  <Link to="/" onClick={() => setOpen(false)}>
                    <Layers className="w-4 h-4 mr-2.5 text-muted-foreground" />
                    MD → APKG
                  </Link>
                </Button>
                <Button
                  variant={location.pathname === "/configure" ? "secondary" : "ghost"}
                  asChild
                  className="justify-start h-9 text-sm font-medium"
                >
                  <Link to="/configure" onClick={() => setOpen(false)}>
                    <RefreshCcw className="w-4 h-4 mr-2.5 text-muted-foreground" />
                    APKG → MD
                  </Link>
                </Button>
                <Button
                  variant={location.pathname === "/llm-merge" ? "secondary" : "ghost"}
                  asChild
                  className="justify-start h-9 text-sm font-medium"
                >
                  <Link to="/llm-merge" onClick={() => setOpen(false)}>
                    <Braces className="w-4 h-4 mr-2.5 text-muted-foreground" />
                    Merge
                  </Link>
                </Button>
                <Button
                  variant={location.pathname === "/remaster" || location.pathname === "/refurbish" ? "secondary" : "ghost"}
                  asChild
                  className="justify-start h-9 text-sm font-medium"
                >
                  <Link to="/remaster" onClick={() => setOpen(false)}>
                    <Wand2 className="w-4 h-4 mr-2.5 text-muted-foreground" />
                    Remaster
                  </Link>
                </Button>
              </nav>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                Library & Guide
              </p>
              <nav className="flex flex-col gap-1">
                <Button
                  variant={
                    location.pathname === "/decks" ||
                    location.pathname.startsWith("/deck/") ||
                    location.pathname.startsWith("/stack/")
                      ? "secondary"
                      : "ghost"
                  }
                  asChild
                  className="justify-start h-9 text-sm font-medium"
                >
                  <Link to="/decks" onClick={() => setOpen(false)}>
                    <BookOpen className="w-4 h-4 mr-2.5 text-muted-foreground" />
                    Decks
                  </Link>
                </Button>
                <Button
                  variant={location.pathname === "/kartenkonzept" ? "secondary" : "ghost"}
                  asChild
                  className="justify-start h-9 text-sm font-medium"
                >
                  <Link to="/kartenkonzept" onClick={() => setOpen(false)}>
                    <Lightbulb className="w-4 h-4 mr-2.5 text-muted-foreground" />
                    Concepts
                  </Link>
                </Button>
                <Button
                  variant={location.pathname === "/genai-cards" ? "secondary" : "ghost"}
                  asChild
                  className="justify-start h-9 text-sm font-medium"
                >
                  <Link to="/genai-cards" onClick={() => setOpen(false)}>
                    <Sparkles className="w-4 h-4 mr-2.5 text-muted-foreground" />
                    Guide
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start h-9 text-sm font-medium">
                  <Link to="?tour=true" onClick={() => setOpen(false)}>
                    <Sparkles className="w-4 h-4 mr-2.5 text-muted-foreground" />
                    Feature Tour
                  </Link>
                </Button>
              </nav>
            </div>

            <div className="mt-auto pt-4 border-t border-border/40 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
              <span>Runs 100% locally in your browser</span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const isWorkspacePage =
    location.pathname === "/" ||
    location.pathname === "/json-to-apkg" ||
    location.pathname === "/configure" ||
    location.pathname === "/llm-merge" ||
    location.pathname === "/remaster" ||
    location.pathname === "/refurbish";

  return (
    <div className={`min-h-screen font-sans antialiased flex flex-col bg-white ${isWorkspacePage ? "h-screen overflow-hidden" : ""}`}>
      <header className="sticky top-0 z-50 w-full glass-nav bg-white/80 backdrop-blur-md border-b border-zinc-200/80 shrink-0">
        <div className="relative w-full flex h-12 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand (Left) */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-xl tracking-tight transition-opacity hover:opacity-85 text-zinc-950"
            >
              <span>Schedae.</span>
            </Link>
          </div>

          {/* Center: True Mathematically Centered Tool Switcher */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 items-center justify-center">
            <ToolSwitcher />
          </div>

          {/* Right: Secondary Nav on desktop, Mobile menu on small screens */}
          <div className="flex items-center">
            <DesktopNav />
            <MobileNav />
          </div>
        </div>
      </header>

      <main className={`flex-1 w-full flex flex-col items-center ${isWorkspacePage ? "min-h-0 overflow-hidden" : ""}`}>
        {children}
      </main>

      {/* Visible Footer: Minimal low-height bar on tool pages, full footer on content pages */}
      {isWorkspacePage ? (
        <footer className="h-7 shrink-0 border-t border-zinc-200/80 bg-zinc-50 flex items-center w-full z-10 select-none">
          <div className="w-full flex items-center justify-between px-4 sm:px-6 text-[11px] text-muted-foreground">
            <p className="leading-none text-muted-foreground/80">
              Built with React & ShadCN &bull; Processing in Browser
            </p>
            <div className="flex items-center gap-3">
              <Link
                to="/open-source"
                className="hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Open Source
              </Link>
              <span className="text-zinc-300">•</span>
              <Link
                to="?tour=true"
                className="hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Feature Tour
              </Link>
              <span className="text-zinc-300">•</span>
              <span>&copy; {new Date().getFullYear()} Schedae</span>
            </div>
          </div>
        </footer>
      ) : (
        <footer className="border-t border-zinc-200 bg-zinc-50 shrink-0">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-8 md:h-16 md:flex-row md:py-0 px-4 max-w-7xl">
            <p className="text-sm leading-loose text-muted-foreground text-center md:text-left">
              Built with React, Vite, and{" "}
              <a
                href="https://ui.shadcn.com"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-4 decoration-muted-foreground/50 hover:decoration-primary"
              >
                shadcn/ui
              </a>
              .
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link
                to="/open-source"
                className="hover:text-foreground underline underline-offset-4 decoration-muted-foreground/40 transition-colors"
              >
                Open Source
              </Link>
              <Link
                to="?tour=true"
                className="hover:text-foreground underline underline-offset-4 decoration-muted-foreground/40 transition-colors"
              >
                Feature Tour
              </Link>
              <span>&copy; {new Date().getFullYear()} Schedae. All rights reserved.</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <OnboardingModal />
        <Routes>
          <Route path="/" element={<JsonToApkg />} />
          <Route path="/json-to-apkg" element={<JsonToApkg />} />
          <Route path="/decks" element={<Home />} />
          <Route path="/kartenkonzept" element={<Kartenkonzept />} />
          <Route path="/genai-cards" element={<GenAiCards />} />
          <Route path="/deck/:id" element={<DeckDetail />} />
          <Route path="/stack/:id" element={<StackDetail />} />
          <Route path="/configure" element={<DeckConverter />} />
          <Route path="/llm-merge" element={<LlmMerge />} />
          <Route path="/remaster" element={<DeckRemaster />} />
          <Route path="/refurbish" element={<DeckRemaster />} />
          <Route path="/deck/create" element={<CreateDeck />} />
          <Route path="/open-access" element={<OpenSource />} />
          <Route path="/open-source" element={<OpenSource />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
