import { unified } from "unified";
import remarkParse from "remark-parse";
import { toString } from "mdast-util-to-string";

export interface SplitSettings {
  id?: string;
  name?: string;
  cardSeparators: string;
  questionMarkers: string;
  answerMarkers: string;
  includeQuestionMarker: boolean;
  includeAnswerMarker: boolean;
  ignoreMarkerBrackets: boolean;
}

type FlashCard = {front: string, back: string};
type MarkdownNode = {
  type: string;
  children?: MarkdownNode[];
  position?: {
    start?: { offset?: number };
    end?: { offset?: number };
  };
};

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function buildSplitRegexes(settings: SplitSettings) {
  const getParts = (str: string) => str.split(",").map(s => s.trim()).filter(Boolean);
  
  const bParts = getParts(settings.cardSeparators).map(s => {
    const escaped = escapeRegExp(s);
    const boundary = s.endsWith('#') ? '(?![#])' : s.match(/[a-zA-Z]$/) ? '\\b' : '';
    // Check if the line starts with the separator 
    // Allow leading spaces, markdown list items (*, -, +), header hashes, or bold markers
    return `^\\s*(?:[*+-]\\s+)?(?:#+\\s+)?(?:\\*\\*|__)?${escaped}${boundary}`;
  });
  const blockRegex = bParts.length > 0 ? new RegExp(`(?=${bParts.join("|")})`, "m") : /(?!x)x/;

  const bracketOpt = settings.ignoreMarkerBrackets ? `\\s*(?:\\([^)]*\\)|\\[[^\]]*\\])?` : ``;

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

  return { blockRegex, questionRegex, answerRegex, qParts, aParts, bParts: getParts(settings.cardSeparators) }; // WAIT! bParts string unescaped or escaped? Let's return the unescaped bParts for cleaning
}

export function extractFlashcardsFromText(text: string, settings: SplitSettings): FlashCard[] {
  const cards: FlashCard[] = [];
  const { blockRegex, questionRegex, answerRegex, bParts } = buildSplitRegexes(settings);

  const lines = text.split("\n");
  const spacedLines = lines.map(line => {
    if (blockRegex.test(line) || questionRegex.test(line) || answerRegex.test(line)) {
      return `\n\n${line}`;
    }
    return line;
  });
  const preprocessedText = spacedLines.join("\n");
  const tree = unified().use(remarkParse).parse(preprocessedText);

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
      // We push the node INSTEAD OF skipping it! 
      // Because we want it to be part of the front side!
      currentChunk.push(node);
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
        if (qMatch) {
            const innerText = qMatch[1] || "";
            // USE replace so it works globally or specifically
            frontMd = frontMd.replace(qMatch[0], innerText).trim();
        }
    }

    if (!settings.includeAnswerMarker && aIndex !== -1) {
        const aMatch = backMd.match(answerRegex);
        if (aMatch) {
            const innerText = aMatch[1] || "";
            backMd = backMd.replace(aMatch[0], innerText).trim();
        }
    }

    // Cleanup structural separators from the FRONT mapping because we included it
    // Wait, the user said "should be removed and only kept if selection is according"
    // Does the user want Card Separators to be stripped from frontMd? Yes, otherwise it will just stay as `# Karte 1: XY`.
    // Let's strip bParts from frontMd
    if (bParts.length > 0) {
        const escapedBParts = bParts.map(s => escapeRegExp(s));
        const bPartsStr = escapedBParts.join("|");
        // We match at the start of the line or string, with optional hashtags/stars, then the marker, then the rest
        const cleanRegex = new RegExp(`^\\s*(?:[*+-]\\s+)?(?:#+\\s+)?(?:\\*\\*|__)?(?:${bPartsStr})\\s*(?:\\*\\*|__)?\\s*:?\\s*(?:\\*\\*|__)?\\s*(.*)$`, "m");
        const bMatch = frontMd.match(cleanRegex);
        if (bMatch) {
           const innerText = bMatch[1] || "";
           frontMd = frontMd.replace(bMatch[0], innerText).trim();
        }
    }

    if (frontMd && backMd) {
        cards.push({ front: frontMd, back: backMd });
    }
  }

  return cards;
}

const md1 = `
# Karte 1: XY
## Frage
das ist die frage
## Antwort
das ist die antwort

**Karte 2: AB**
*Frage:* abc
*Antwort:* def
`;

const settings = {
  cardSeparators: "### Karte, ## Karte, # Karte, Karte, **Karte",
  questionMarkers: "### Frage, ## Frage, # Frage, *Frage:*, Frage:",
  answerMarkers: "### Antwort, ## Antwort, # Antwort, *Antwort:*, Antwort:",
  includeQuestionMarker: false,
  includeAnswerMarker: false,
  ignoreMarkerBrackets: true,
};

console.log("MD1", extractFlashcardsFromText(md1, settings));
