export interface Flashcard {
  id: string;
  front: string;
  back: string;
  customFields?: Record<string, string>;
  tags?: string;
  guid?: string;
  mid?: number;
  mod?: number;
  usn?: number;
  deckId?: string;
  deckName?: string;
  scheduling?: {
    type: number;
    queue: number;
    due: number;
    ivl: number;
    factor: number;
    reps: number;
    lapses: number;
    left: number;
    odue: number;
    odid: number;
    flags: number;
    mod: number;
    usn: number;
  };
}

export interface DeckInsights {
  cardCount: number;
  noteCount?: number;
  includesScheduling: boolean;
  newCount: number;
  learningCount: number;
  reviewCount: number;
  suspendedCount: number;
  taggedCardCount: number;
  deckPathCount?: number;
}

export interface DeckSubset {
  name: string;
  cardCount: number;
}

export type DeckCreationTag = "AI Generated" | "AI Enhanced" | "Manual Tag";

export interface Deck {
  id: string;
  title: string;
  description: string;
  topic: string;
  author: string;
  date: string;
  complexity: "Anfänger" | "Fortgeschritten" | "Profi";
  level: string;
  cards?: Flashcard[];
  cardsUrl?: string;
  cardCount?: number;
  insights?: DeckInsights;
  creationTag?: DeckCreationTag;
  subsets?: DeckSubset[];
  stackId?: string;
  /** Per-deck CSS extracted from the source file (e.g. Anki notetype styles). */
  style?: string;
}

export type StackColor = "violet" | "blue" | "emerald" | "amber" | "rose";

export interface DeckStack {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  discipline: string;
  deckIds: string[];
  color: StackColor;
  totalCards: number;
}

export interface PublicDeckManifestItem {
  id?: string;
  file?: string;
  cardsUrl?: string;
  stackId?: string;
  title?: string;
  description?: string;
  topic?: string;
  author?: string;
  date?: string;
  complexity?: Deck["complexity"];
  level?: string;
  creationTag?: DeckCreationTag;
  style?: string;
  cardCount?: number;
  insights?: DeckInsights;
  subsets?: DeckSubset[];
}

export interface PublicDeckManifest {
  format?: string;
  decks: PublicDeckManifestItem[];
}

// ---------------------------------------------------------------------------
// RFC-4180 compliant CSV parser that correctly handles quoted fields containing
// commas, newlines, and escaped double-quotes ("" → ").
// ---------------------------------------------------------------------------
function parseCSV(text: string): string[][] {
  const records: string[][] = [];
  let i = 0;
  const n = text.length;

  while (i < n) {
    // Skip bare CR/LF between records
    if (text[i] === "\r") { i++; if (i < n && text[i] === "\n") i++; continue; }
    if (text[i] === "\n") { i++; continue; }

    const record: string[] = [];
    let endOfRecord = false;

    while (!endOfRecord && i < n) {
      if (text[i] === '"') {
        // Quoted field: may span multiple lines; "" is an escaped "
        i++;
        let field = "";
        while (i < n) {
          if (text[i] === '"') {
            if (i + 1 < n && text[i + 1] === '"') {
              field += '"';
              i += 2;
            } else {
              i++; // closing quote
              break;
            }
          } else {
            field += text[i++];
          }
        }
        record.push(field);
        if (i < n && text[i] === ",") {
          i++;
        } else {
          if (i < n && text[i] === "\r") i++;
          if (i < n && text[i] === "\n") i++;
          endOfRecord = true;
        }
      } else {
        // Unquoted field
        let field = "";
        while (i < n && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
          field += text[i++];
        }
        record.push(field);
        if (i < n && text[i] === ",") {
          i++;
        } else {
          if (i < n && text[i] === "\r") i++;
          if (i < n && text[i] === "\n") i++;
          endOfRecord = true;
        }
      }
    }

    if (record.length >= 2) records.push(record);
  }

  return records;
}

export interface FetchDeckResult {
  cards: Flashcard[];
  style?: string;
  insights?: DeckInsights;
  subsets?: DeckSubset[];
}

function summarizeCards(cards: Flashcard[]): DeckInsights {
  let newCount = 0;
  let learningCount = 0;
  let reviewCount = 0;
  let suspendedCount = 0;
  let taggedCardCount = 0;
  let includesScheduling = false;

  for (const card of cards) {
    if (card.tags && card.tags.trim()) taggedCardCount++;

    const sched = card.scheduling;
    if (!sched) continue;
    includesScheduling = true;

    if (sched.queue === -1) {
      suspendedCount++;
      continue;
    }

    if (sched.queue === 0 || sched.type === 0) {
      newCount++;
      continue;
    }

    if (sched.queue === 1 || sched.queue === 3) {
      learningCount++;
      continue;
    }

    if (sched.queue === 2 || sched.type === 2) {
      reviewCount++;
    }
  }

  return {
    cardCount: cards.length,
    includesScheduling,
    newCount,
    learningCount,
    reviewCount,
    suspendedCount,
    taggedCardCount,
  };
}

function normalizeScheduling(raw: any): Flashcard["scheduling"] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  return {
    type: Number(raw.type ?? 0),
    queue: Number(raw.queue ?? 0),
    due: Number(raw.due ?? 0),
    ivl: Number(raw.ivl ?? 0),
    factor: Number(raw.factor ?? 0),
    reps: Number(raw.reps ?? 0),
    lapses: Number(raw.lapses ?? 0),
    left: Number(raw.left ?? 0),
    odue: Number(raw.odue ?? 0),
    odid: Number(raw.odid ?? 0),
    flags: Number(raw.flags ?? 0),
    mod: Number(raw.mod ?? 0),
    usn: Number(raw.usn ?? 0),
  };
}

export async function fetchDeckCards(url: string): Promise<FetchDeckResult> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch deck data");
    const text = await response.text();

    const trimmed = text.trim();

    // ── JSON format: reduced-v2, { style?, cards: [...] }, or plain [...] ──
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      const parsed: any = JSON.parse(trimmed);

      if (!Array.isArray(parsed) && parsed?.decks?.byId && typeof parsed.decks.byId === "object") {
        const cards: Flashcard[] = [];
        const subsets: DeckSubset[] = [];
        let deckPathCount = 0;

        for (const [deckId, deck] of Object.entries(parsed.decks.byId as Record<string, any>)) {
          deckPathCount++;
          const notes = Array.isArray(deck?.notes) ? deck.notes : [];
          let subsetCardCount = 0;
          for (const note of notes) {
            const noteCards = Array.isArray(note?.cards) && note.cards.length > 0
              ? note.cards
              : [{ id: undefined, ord: 0, did: Number(deckId), scheduling: undefined }];

            subsetCardCount += noteCards.length;

            for (const card of noteCards) {
              cards.push({
                id: String(card.id ?? `${deckId}:${note.id ?? cards.length}:${card.ord ?? 0}`),
                front: String(note?.front ?? ""),
                back: String(note?.back ?? ""),
                tags: typeof note?.tags === "string" ? note.tags : undefined,
                guid: typeof note?.guid === "string" ? note.guid : undefined,
                mid: typeof note?.mid === "number" ? note.mid : undefined,
                mod: typeof note?.mod === "number" ? note.mod : undefined,
                usn: typeof note?.usn === "number" ? note.usn : undefined,
                deckId,
                deckName: typeof deck?.fullName === "string" ? deck.fullName : deck?.name,
                scheduling: normalizeScheduling(card?.scheduling),
              });
            }
          }

          subsets.push({
            name:
              typeof deck?.fullName === "string" && deck.fullName.trim().length > 0
                ? deck.fullName
                : typeof deck?.name === "string" && deck.name.trim().length > 0
                  ? deck.name
                  : `Deck ${deckId}`,
            cardCount: subsetCardCount,
          });
        }

        const insights = summarizeCards(cards);
        insights.noteCount = parsed.summary?.noteEntryCount;
        insights.includesScheduling = parsed.summary?.includesScheduling ?? insights.includesScheduling;
        insights.deckPathCount = deckPathCount;

        return { cards, style: parsed.style, insights, subsets };
      }

      const rawCards: Array<{ front: string; back: string }> = Array.isArray(parsed) ? parsed : parsed.cards ?? [];
      const style = Array.isArray(parsed) ? undefined : parsed.style;

      const cards: Flashcard[] = rawCards
        .filter((c: { front: string; back: string }) => c.front || c.back)
        .map((c: { front: string; back: string }, i: number) => ({ id: `card-${i}`, front: c.front, back: c.back }));

      return { cards, style, insights: summarizeCards(cards) };
    }

    // ── CSV format ──────────────────────────────────────────────────────────
    const records = parseCSV(text);
    const cards: Flashcard[] = [];

    // Skip header row if it contains "front" / "back"
    const startIndex =
      records.length > 0 && records[0][0].toLowerCase().includes("front") ? 1 : 0;

    for (let i = startIndex; i < records.length; i++) {
      const front = records[i][0].trim();
      const back = records[i][1].trim();
      if (front && back) {
        cards.push({ id: `card-${i}`, front, back });
      }
    }

    return { cards, insights: summarizeCards(cards) };
  } catch (error) {
    console.error("Error loading deck:", error);
    return { cards: [] };
  }
}

export function getDeckCardCount(deck: Deck): number | null {
  if (Array.isArray(deck.cards) && deck.cards.length > 0) return deck.cards.length;
  if (typeof deck.cardCount === "number") return deck.cardCount;
  if (typeof deck.insights?.cardCount === "number") return deck.insights.cardCount;
  return null;
}

function toDeckSortTimestamp(deck: Deck): number {
  const parsedDate = Date.parse(deck.date);
  if (Number.isFinite(parsedDate)) return parsedDate;

  const customIdMatch = /^custom-(\d+)$/.exec(deck.id);
  if (customIdMatch) return Number(customIdMatch[1]);

  return 0;
}

export function compareDecksNewestFirst(a: Deck, b: Deck): number {
  return toDeckSortTimestamp(b) - toDeckSortTimestamp(a);
}

function normalizeCreationTag(raw: unknown): DeckCreationTag | undefined {
  if (raw === "AI Generated" || raw === "AI Enhanced" || raw === "Manual Tag") return raw;
  return undefined;
}

function slugFromPath(filePath: string): string {
  const base = filePath.split("/").pop() ?? filePath;
  return base.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

function mergeDeckMetadata(partial: Partial<Deck>, cardsUrl: string): Deck {
  const inferredCount =
    typeof partial.cardCount === "number"
      ? partial.cardCount
      : typeof partial.insights?.cardCount === "number"
        ? partial.insights.cardCount
        : Array.isArray(partial.cards)
          ? partial.cards.length
          : undefined;

  return {
    id: partial.id?.trim() || slugFromPath(cardsUrl),
    title: partial.title?.trim() || partial.id?.trim() || slugFromPath(cardsUrl),
    description: partial.description?.trim() || "",
    topic: partial.topic?.trim() || "Allgemein",
    author: partial.author?.trim() || "Unbekannt",
    date: partial.date?.trim() || new Date().toISOString().slice(0, 10),
    complexity:
      partial.complexity === "Fortgeschritten" || partial.complexity === "Profi"
        ? partial.complexity
        : "Anfänger",
    level: partial.level?.trim() || "BSc",
    creationTag: normalizeCreationTag(partial.creationTag),
    style: typeof partial.style === "string" ? partial.style : undefined,
    cardsUrl,
    cardCount: inferredCount,
    insights: partial.insights,
    subsets: Array.isArray(partial.subsets) ? partial.subsets : undefined,
    stackId: typeof partial.stackId === "string" && partial.stackId.trim() ? partial.stackId.trim() : undefined,
  };
}

async function readDeckMetadataFromJson(cardsUrl: string): Promise<Partial<Deck>> {
  try {
    const response = await fetch(cardsUrl);
    if (!response.ok) return {};

    const parsed: any = JSON.parse(await response.text());
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const cards = Array.isArray(parsed.cards) ? parsed.cards : undefined;
    const insights = parsed.insights && typeof parsed.insights === "object"
      ? parsed.insights as DeckInsights
      : undefined;

    return {
      id: typeof parsed.id === "string" ? parsed.id : undefined,
      stackId:
        typeof parsed.stackId === "string"
          ? parsed.stackId
          : typeof parsed.stack === "string"
            ? parsed.stack
            : typeof parsed.stack?.id === "string"
              ? parsed.stack.id
              : undefined,
      title: typeof parsed.title === "string" ? parsed.title : undefined,
      description: typeof parsed.description === "string" ? parsed.description : undefined,
      topic: typeof parsed.topic === "string" ? parsed.topic : undefined,
      author: typeof parsed.author === "string" ? parsed.author : undefined,
      date: typeof parsed.date === "string" ? parsed.date : undefined,
      complexity: parsed.complexity,
      level: typeof parsed.level === "string" ? parsed.level : undefined,
      creationTag: normalizeCreationTag(parsed.creationTag),
      style: typeof parsed.style === "string" ? parsed.style : undefined,
      cardCount: typeof parsed.cardCount === "number" ? parsed.cardCount : cards?.length,
      insights,
      subsets: Array.isArray(parsed.subsets) ? parsed.subsets as DeckSubset[] : undefined,
    };
  } catch {
    return {};
  }
}

function toCardsUrl(item: PublicDeckManifestItem): string | null {
  if (typeof item.cardsUrl === "string" && item.cardsUrl.trim()) return item.cardsUrl.trim();
  if (typeof item.file === "string" && item.file.trim()) return `/data/decks/${item.file.trim()}`;
  return null;
}

let cachedPublicDecks: Deck[] | null = null;
let publicDecksPromise: Promise<Deck[]> | null = null;

export function mergeDeckLists(base: Deck[], extra: Deck[]): Deck[] {
  const merged = new Map<string, Deck>();
  for (const deck of base) merged.set(deck.id, deck);
  for (const deck of extra) merged.set(deck.id, deck);
  return Array.from(merged.values());
}

export function getAllDecksSync(): Deck[] {
  return mergeDeckLists(mockDecks, cachedPublicDecks ?? []);
}

export async function loadPublicDecksFromManifest(forceReload = false): Promise<Deck[]> {
  if (!forceReload && cachedPublicDecks) return cachedPublicDecks;
  if (!forceReload && publicDecksPromise) return publicDecksPromise;

  publicDecksPromise = (async () => {
    try {
      const response = await fetch("/data/decks/index.json");
      if (!response.ok) {
        cachedPublicDecks = [];
        return cachedPublicDecks;
      }

      const parsed: any = JSON.parse(await response.text());
      const items: PublicDeckManifestItem[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.decks)
          ? parsed.decks
          : [];

      const decks = await Promise.all(
        items.map(async (item) => {
          const cardsUrl = toCardsUrl(item);
          if (!cardsUrl) return null;

          const fileMetadata = cardsUrl.endsWith(".json") ? await readDeckMetadataFromJson(cardsUrl) : {};
          return mergeDeckMetadata({ ...fileMetadata, ...item }, cardsUrl);
        })
      );

      cachedPublicDecks = decks.filter((deck): deck is Deck => Boolean(deck));
      attachPublicDecksToStacks(cachedPublicDecks);
      return cachedPublicDecks;
    } catch {
      cachedPublicDecks = [];
      return cachedPublicDecks;
    } finally {
      publicDecksPromise = null;
    }
  })();

  return publicDecksPromise;
}

function attachPublicDecksToStacks(publicDecks: Deck[]) {
  for (const deck of publicDecks) {
    const explicitStack = deck.stackId
      ? mockStacks.find((candidate) => candidate.id === deck.stackId)
      : undefined;

    const inferredStack = !explicitStack && deck.topic.trim()
      ? (() => {
          const matches = mockStacks.filter(
            (candidate) => candidate.discipline.trim().toLowerCase() === deck.topic.trim().toLowerCase()
          );
          return matches.length === 1 ? matches[0] : undefined;
        })()
      : undefined;

    const stack = explicitStack ?? inferredStack;
    if (!stack || stack.deckIds.includes(deck.id)) continue;

    stack.deckIds.push(deck.id);
    stack.totalCards += getDeckCardCount(deck) ?? 0;
  }
}

export const mockDecks: Deck[] = [
  // ── Mathematik ──────────────────────────────────────────────────────────
  {
    id: "math-101",
    title: "Analysis Grundlagen",
    description: "Wichtige Konzepte und Formeln für Analysis I – Grenzwerte, Ableitungen, Integrale.",
    topic: "Mathematik",
    author: "Prof. Euler",
    date: "2023-09-15",
    complexity: "Fortgeschritten",
    level: "Universität",
    cardsUrl: "/data/decks/math-101.csv",
    cards: [],
  },
  {
    id: "math-stoch",
    title: "Stochastik & Statistik",
    description: "Wahrscheinlichkeitsrechnung, Verteilungen, Erwartungswert und statistische Tests.",
    topic: "Mathematik",
    author: "Prof. Bayes",
    date: "2024-03-22",
    complexity: "Anfänger",
    level: "Gymnasium / Uni",
    cards: [
      { id: "st1", front: "Was ist der Erwartungswert?", back: "Das gewichtete Mittel aller möglichen Werte einer Zufallsvariablen: E[X] = Σ x · P(X=x)." },
      { id: "st2", front: "Satz von Bayes", back: "P(A|B) = P(B|A) · P(A) / P(B)" },
      { id: "st3", front: "Normalverteilung", back: "Symmetrische Glockenkurve mit μ (Erwartungswert) und σ (Standardabweichung)." },
    ],
  },
  // ── Philosophie ─────────────────────────────────────────────────────────
  // these are as json
  // ── Informatik ──────────────────────────────────────────────────────────
  {
    id: "cs-algo",
    title: "Datenstrukturen & Algorithmen",
    description: "Gängige Algorithmen und Datenstrukturen für technische Interviews und Studium.",
    topic: "Informatik",
    author: "Ada Lovelace",
    date: "2023-11-20",
    complexity: "Profi",
    level: "Universität",
    cards: [
      { id: "cs1", front: "Zeitkomplexität der binären Suche", back: "O(log n)" },
      { id: "cs2", front: "Was ist eine Hash-Tabelle?", back: "Eine Datenstruktur, die einen assoziativen Array implementiert, um Schlüssel auf Werte abzubilden." },
      { id: "cs3", front: "Quick Sort durchschnittliche Zeitkomplexität", back: "O(n log n)" },
      { id: "cs4", front: "Was ist ein Graph?", back: "Eine nicht-lineare Datenstruktur bestehend aus Knoten und Kanten." },
      { id: "cs5", front: "DFS vs. BFS", back: "DFS geht in die Tiefe (nutzt Stack). BFS geht in die Breite (nutzt Queue)." },
    ],
  },
];

// ---------------------------------------------------------------------------
// Stacks – hochspezifisch kuratierte wissenschaftliche Fach-Cluster
// ---------------------------------------------------------------------------

export const mockStacks: DeckStack[] = [
  {
    id: "phil-epistemik",
    title: "Epistemologie & Wissenschaftstheorie",
    subtitle: "Epistemologie · Erkenntnistheorie · Wissenschaftstheorie · Normative Ethik",
    description: "Spezifische Sammlungen zur Epistemologie und Wissenschaftstheorie: Von Platons Höhlengleichnis und Gettier-Problemen bis zu Poppers Falsifikationismus.",
    discipline: "Philosophie",
    deckIds: ["phil-erkenntnistheorie", "phil-logic", "phil-wissenschaftstheorie", "phil-ethics"],
    color: "violet",
    totalCards: 13,
  },
  {
    id: "mathematik-kern",
    title: "Mathematische Grundlagen",
    subtitle: "Analysis & Infinitesimalrechnung · Stochastik & Wahrscheinlichkeitstheorie",
    description: "Mathematische Teildisziplinen – von Infinitesimalrechnung und Grenzwertexploration bis zu Stochastik und Bayesscher Statistik.",
    discipline: "Mathematik",
    deckIds: ["math-101", "math-linalg", "math-stoch"],
    color: "blue",
    totalCards: 16,
  },
  {
    id: "informatik-systeme",
    title: "Informatik: Systeme & Algorithmen",
    subtitle: "Theoretische Informatik · Algorithmen & Datenstrukturen · Systeme",
    description: "Fundierte Betrachtung wissenschaftlicher Informatik-Cluster: Asymptotische Laufzeitanalyse O(n log n), Graph-Traversierung und Systemarchitekturen.",
    discipline: "Informatik",
    deckIds: ["cs-algo", "cs-os", "cs-networks"],
    color: "emerald",
    totalCards: 12,
  },
];