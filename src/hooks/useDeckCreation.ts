import { useState, useMemo } from "react";
import { mockStacks, mockDecks, type DeckCreationTag } from "@/data/decks";

export const COMPLEXITY_OPTIONS = ["Anfänger", "Fortgeschritten", "Profi"] as const;
export type Complexity = (typeof COMPLEXITY_OPTIONS)[number];
export const LEVEL_OPTIONS = ["BSc", "MSc", "PhD", "Beruf", "Hobby"] as const;
export const CREATION_TAG_OPTIONS = ["AI Generated", "AI Enhanced", "Manual Tag"] as const;
export type BelongingMode = "standalone" | "existing-stack" | "new-stack";

export interface Subset {
  id: string;
  name: string;
  cardCount: number;
}

export function slugifyFileName(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "deck"
  );
}

export interface UseDeckCreationOptions {
  rawCards?: unknown;
  suggestedTitle?: string;
  style?: string;
}

export function useDeckCreation({
  rawCards = [],
  suggestedTitle = "",
  style = "",
}: UseDeckCreationOptions) {
  // ── Parse Input ───────────────────────────────────────────────────────────
  const { parsedCards, initialSubsets, initialSubsetsEnabled } = useMemo(() => {
    let raw: unknown = rawCards;
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {
        // fallback
      }
    }

    const cardsArray: any[] = [];
    const subsetsResult: Subset[] = [];

    const rawObj = raw as any;
    if (rawObj && typeof rawObj === "object" && rawObj.format === "anki-apkg-reduced-v2" && rawObj.decks?.byId) {
      Object.values(rawObj.decks.byId).forEach((deck: any) => {
        if (!Array.isArray(deck.notes)) return;
        const deckName = typeof deck.fullName === "string" ? deck.fullName : deck.name;
        let count = 0;

        deck.notes.forEach((note: any) => {
          const fldsParts = typeof note.flds === "string" ? note.flds.split("\x1f") : [];
          const front = String(note.front ?? fldsParts[0] ?? "");
          const back = String(note.back ?? fldsParts[1] ?? "");
          if (!front && !back) return;

          cardsArray.push({
            id: note.id || note.guid,
            front,
            back,
            tags: typeof note.tags === "string" ? note.tags : undefined,
            guid: typeof note.guid === "string" ? note.guid : undefined,
            mid: typeof note.mid === "number" ? note.mid : undefined,
            mod: typeof note.mod === "number" ? note.mod : undefined,
            usn: typeof note.usn === "number" ? note.usn : undefined,
            deckName,
            cards: Array.isArray(note.cards) ? note.cards : undefined,
          });
          count++;
        });

        if (count > 0) {
          subsetsResult.push({
            id: `s-${deck.id || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: deckName || "Default",
            cardCount: count,
          });
        }
      });
    } else if (Array.isArray(raw)) {
      cardsArray.push(...raw);
      const groups = new Map<string, number>();
      let hasDeckNames = false;

      raw.forEach((card: any) => {
        if (card.deckName) {
          hasDeckNames = true;
          groups.set(card.deckName, (groups.get(card.deckName) || 0) + 1);
        }
      });

      if (hasDeckNames && groups.size > 0) {
        for (const [name, count] of groups.entries()) {
          subsetsResult.push({
            id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name,
            cardCount: count,
          });
        }
      }
    }

    if (subsetsResult.length === 0) {
      subsetsResult.push({ id: "s1", name: "", cardCount: Math.max(1, cardsArray.length) });
    }

    return {
      parsedCards: cardsArray,
      initialSubsets: subsetsResult,
      initialSubsetsEnabled: subsetsResult.length > 1,
    };
  }, [rawCards]);

  const cards = parsedCards;

  // ── Metadata ──────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(suggestedTitle);
  const [topic, setTopic] = useState("");
  const [author, setAuthor] = useState("");
  const [complexity, setComplexity] = useState<Complexity>("Anfänger");
  const [level, setLevel] = useState("BSc");
  const [creationTag, setCreationTag] = useState<DeckCreationTag>("AI Enhanced");
  const [description, setDescription] = useState("");

  // ── Structure: belonging ──────────────────────────────────────────────────
  const [belongingMode, setBelongingMode] = useState<BelongingMode>("standalone");
  const [selectedStackId, setSelectedStackId] = useState(mockStacks[0]?.id ?? "");
  const [newStackName, setNewStackName] = useState("");

  // ── Structure: subsets ────────────────────────────────────────────────────
  const [subsetsEnabled, setSubsetsEnabled] = useState(initialSubsetsEnabled);
  const [subsets, setSubsets] = useState<Subset[]>(initialSubsets);

  const subsetTotal = useMemo(() => subsets.reduce((s, x) => s + x.cardCount, 0), [subsets]);
  const subsetOverflow = subsetTotal > cards.length;
  const subsetUnderflow = subsetTotal < cards.length && cards.length > 0;

  const handleSubsetChange = (id: string, field: "name" | "cardCount", value: string | number) => {
    setSubsets((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const addSubset = () => {
    const remaining = Math.max(1, cards.length - subsetTotal);
    setSubsets((prev) => [...prev, { id: `s${Date.now()}`, name: "", cardCount: remaining }]);
  };

  const removeSubset = (id: string) => setSubsets((prev) => prev.filter((s) => s.id !== id));

  // ── Preview ───────────────────────────────────────────────────────────────
  const [showAllCards, setShowAllCards] = useState(false);
  const previewCards = useMemo(() => (showAllCards ? cards : cards.slice(0, 5)), [cards, showAllCards]);

  const cardSectionLabel = useMemo<string[]>(() => {
    if (!subsetsEnabled || subsets.length === 0) return [];
    const labels: string[] = [];
    for (const s of subsets) {
      const name = s.name.trim() || `Teilbereich ${subsets.indexOf(s) + 1}`;
      for (let i = 0; i < s.cardCount; i++) labels.push(name);
    }
    return labels;
  }, [subsetsEnabled, subsets]);

  // ── Submission & Exports ──────────────────────────────────────────────────
  const [submitted, setSubmitted] = useState(false);
  const [exportJson, setExportJson] = useState<Record<string, any> | null>(null);
  const [manifestExportJson, setManifestExportJson] = useState<Record<string, any> | null>(null);
  const [mergedIndexJson, setMergedIndexJson] = useState<Record<string, any> | null>(null);
  const [exportFileName, setExportFileName] = useState("deck.json");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const isValid = Boolean(
    title.trim() &&
      topic.trim() &&
      author.trim() &&
      description.trim() &&
      (belongingMode !== "new-stack" || newStackName.trim()) &&
      (!subsetsEnabled || (!subsetOverflow && !subsetUnderflow))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const deckId = `custom-${Date.now()}`;
    const newStackId = `custom-stack-${Date.now()}`;
    const assignedStackId =
      belongingMode === "existing-stack"
        ? selectedStackId
        : belongingMode === "new-stack"
        ? newStackId
        : undefined;

    const createdDeck = {
      id: deckId,
      stackId: assignedStackId,
      title: title.trim(),
      description: description.trim(),
      topic: topic.trim(),
      author: author.trim(),
      date: new Date().toISOString().slice(0, 10),
      complexity,
      level,
      cards,
      style,
      creationTag,
      subsets: subsetsEnabled
        ? subsets.map((s, i) => ({
            name: s.name.trim() || `Teilbereich ${i + 1}`,
            cardCount: s.cardCount,
          }))
        : undefined,
      cardCount: cards.length,
      insights: {
        cardCount: cards.length,
        includesScheduling: cards.some((c: any) => Array.isArray(c?.cards) && c.cards.some((x: any) => x?.scheduling)),
        newCount: 0,
        learningCount: 0,
        reviewCount: 0,
        suspendedCount: 0,
        taggedCardCount: cards.filter((c: any) => typeof c?.tags === "string" && c.tags.trim().length > 0).length,
      },
    };

    const downloadableDeck = {
      format: "knowledge-flashcards-deck-v1",
      exportedAt: new Date().toISOString(),
      ...createdDeck,
    };

    const fileName = `${slugifyFileName(createdDeck.title)}.json`;
    const manifestEntry = {
      id: createdDeck.id,
      stackId: createdDeck.stackId,
      file: fileName,
      title: createdDeck.title,
      description: createdDeck.description,
      topic: createdDeck.topic,
      author: createdDeck.author,
      date: createdDeck.date,
      complexity: createdDeck.complexity,
      level: createdDeck.level,
      creationTag: createdDeck.creationTag,
      cardCount: createdDeck.cardCount,
      insights: createdDeck.insights,
      subsets: createdDeck.subsets,
    };

    mockDecks.unshift(createdDeck as any);

    if (belongingMode === "existing-stack" && selectedStackId) {
      const stack = mockStacks.find((s) => s.id === selectedStackId);
      if (stack && !stack.deckIds.includes(deckId)) {
        stack.deckIds.push(deckId);
        stack.totalCards += cards.length;
      }
    }

    if (belongingMode === "new-stack" && newStackName.trim()) {
      mockStacks.unshift({
        id: newStackId,
        title: newStackName.trim(),
        subtitle: `${topic.trim()} · Kuratiert`,
        description: `Benutzerdefinierter Stack mit ${cards.length} Karten.`,
        discipline: topic.trim() || "Allgemein",
        deckIds: [deckId],
        color: "blue",
        totalCards: cards.length,
      });
    }

    setExportJson(downloadableDeck);
    setManifestExportJson({
      format: "knowledge-flashcards-public-manifest-v1",
      decks: [manifestEntry],
    });
    setExportFileName(fileName);

    fetch("/data/decks/index.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((existing) => {
        if (existing && Array.isArray(existing.decks)) {
          setMergedIndexJson({
            format: existing.format || "knowledge-flashcards-public-manifest-v1",
            decks: [manifestEntry, ...existing.decks.filter((d: any) => d.id !== manifestEntry.id)],
          });
        } else {
          setMergedIndexJson({
            format: "knowledge-flashcards-public-manifest-v1",
            decks: [manifestEntry],
          });
        }
      })
      .catch(() => {
        setMergedIndexJson({
          format: "knowledge-flashcards-public-manifest-v1",
          decks: [manifestEntry],
        });
      });

    setSubmitted(true);
  };

  const downloadDeckJson = () => {
    if (!exportJson) return;
    const blob = new Blob([JSON.stringify(exportJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = exportFileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadMergedIndexJson = () => {
    if (!mergedIndexJson) return;
    const blob = new Blob([JSON.stringify(mergedIndexJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "index.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyManifestSnippet = () => {
    if (!manifestExportJson?.decks?.[0]) return;
    const snippet = JSON.stringify(manifestExportJson.decks[0], null, 2);
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return {
    cards,
    title,
    setTitle,
    topic,
    setTopic,
    author,
    setAuthor,
    complexity,
    setComplexity,
    level,
    setLevel,
    creationTag,
    setCreationTag,
    description,
    setDescription,
    belongingMode,
    setBelongingMode,
    selectedStackId,
    setSelectedStackId,
    newStackName,
    setNewStackName,
    subsetsEnabled,
    setSubsetsEnabled,
    subsets,
    setSubsets,
    subsetTotal,
    subsetOverflow,
    subsetUnderflow,
    handleSubsetChange,
    addSubset,
    removeSubset,
    showAllCards,
    setShowAllCards,
    previewCards,
    cardSectionLabel,
    submitted,
    setSubmitted,
    exportJson,
    manifestExportJson,
    mergedIndexJson,
    exportFileName,
    copiedSnippet,
    isValid,
    handleSubmit,
    downloadDeckJson,
    downloadMergedIndexJson,
    copyManifestSnippet,
  };
}
