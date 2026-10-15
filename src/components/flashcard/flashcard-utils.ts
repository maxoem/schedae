import { marked } from 'marked';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import DOMPurify from 'dompurify';

// Configure marked: pass existing HTML through, enable GFM (tables, strikethrough, etc.)
marked.setOptions({ gfm: true });

export const STORAGE_KEY = 'flashcard-markdown-css';

export const DEFAULT_MARKDOWN_CSS = `/* ── Main container ──────────────────────────── */
/* ── Typography ──────────────────────────────── */
.flashcard-prose {
  font-size: 0.95rem;
  line-height: 1.7;
  font-family: inherit;
  color: inherit;
}

/* ── Headings ──────────────────────────────── */
.flashcard-prose h1,
.flashcard-prose h2,
.flashcard-prose h3,
.flashcard-prose h4,
.flashcard-prose h5,
.flashcard-prose h6 {
  margin-top: 1.1em;
  margin-bottom: 0.35em;
  line-height: 1.3;
}

.flashcard-prose :is(h1, h2, h3, h4, h5, h6):first-child {
  margin-top: 0;
}

.flashcard-prose h1 { font-size: 1.4em; font-weight: 700; }
.flashcard-prose h2 { font-size: 1.2em; font-weight: 600; }
.flashcard-prose h3 { font-size: 1.05em; font-weight: 600; }
.flashcard-prose h4,
.flashcard-prose h5,
.flashcard-prose h6 { font-size: 1em; font-weight: 600; }

/* ── Paragraphs & spacing ──────────────────── */
.flashcard-prose p { margin: 0 0 0.75em; }
.flashcard-prose p:last-child { margin-bottom: 0; }

/* ── Lists ─────────────────────────────────── */
.flashcard-prose ul { list-style: disc; padding-left: 1.5em; margin: 0 0 0.75em; }
.flashcard-prose ol { list-style: decimal; padding-left: 1.5em; margin: 0 0 0.75em; }
.flashcard-prose li { margin-bottom: 0.4em; }
.flashcard-prose li:last-child { margin-bottom: 0; }

/* List directly after a heading gets less top margin */
.flashcard-prose :is(h1, h2, h3, h4, h5, h6) + ul,
.flashcard-prose :is(h1, h2, h3, h4, h5, h6) + ol {
  margin-top: 0.1em;
}

/* Nested lists */
.flashcard-prose ul ul,
.flashcard-prose ol ol,
.flashcard-prose ul ol,
.flashcard-prose ol ul {
  margin-top: 0.3em;
  margin-bottom: 0;
}

/* ── Inline code & blocks ──────────────────── */
.flashcard-prose code {
  background: rgba(0,0,0,0.07);
  padding: 0.1em 0.35em;
  border-radius: 3px;
  font-size: 0.88em;
  font-family: ui-monospace, monospace;
}
.flashcard-prose pre {
  background: rgba(0,0,0,0.06);
  border: 1px solid rgba(0,0,0,0.1);
  padding: 0.85em 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.25em 0 0.75em;
}
.flashcard-prose pre code { background: none; padding: 0; font-size: 0.9em; }

/* ── Tables ─────────────────────────────────── */
.flashcard-prose table { border-collapse: collapse; width: 100%; margin: 0.25em 0 0.75em; }
.flashcard-prose th,
.flashcard-prose td { border: 1px solid rgba(0,0,0,0.15); padding: 0.4em 0.7em; text-align: left; }
.flashcard-prose th { background: rgba(0,0,0,0.05); font-weight: 600; }

/* ── Blockquote ─────────────────────────────── */
.flashcard-prose blockquote {
  border-left: 3px solid rgba(0,0,0,0.18);
  padding: 0.1em 0 0.1em 0.9em;
  color: rgba(0,0,0,0.58);
  margin: 0.25em 0 0.75em;
  font-style: italic;
}

/* ── Misc ───────────────────────────────────── */
.flashcard-prose a { color: hsl(var(--primary)); text-decoration: underline; }
.flashcard-prose strong { font-weight: 700; }
.flashcard-prose em { font-style: italic; }
.flashcard-prose hr { border: none; border-top: 1px solid rgba(0,0,0,0.12); margin: 1em 0; }
.flashcard-prose img { max-width: 100%; height: auto; border-radius: 4px; }
`;

/**
 * Protect math expressions from markdown processing, render them with KaTeX,
 * then restore them into the resulting HTML.
 */
export const renderMath = (content: string): string => {
  const placeholders: string[] = [];
  let result = content;

  // 1. Extract display math $$...$$
  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_match, tex) => {
    const idx = placeholders.length;
    try {
      placeholders.push(katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false }));
    } catch {
      placeholders.push(`<span class="katex-error">$$${tex}$$</span>`);
    }
    return `@@MATH_BLOCK_${idx}@@`;
  });

  // 2. Extract inline math $...$  (skip lone $ not followed by content+$)
  result = result.replace(/\$([^$\n]+?)\$/g, (_match, tex) => {
    const idx = placeholders.length;
    try {
      placeholders.push(katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false }));
    } catch {
      placeholders.push(`<span class="katex-error">$${tex}$</span>`);
    }
    return `@@MATH_INLINE_${idx}@@`;
  });

  return result.replace(/@@MATH_(BLOCK|INLINE)_(\d+)@@/g, (_m, _type, i) => placeholders[+i]);
};

/**
 * Walk all text nodes and render inline markdown within them,
 * so that *italic* / **bold** inside <span> tags are also converted.
 * Math placeholders (@@MATH_...@@) are left untouched here.
 */
const renderMarkdownInTextNodes = (node: Node): void => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    if (/\*|_|`/.test(text) && !text.includes('@@MATH_')) {
      const html = marked.parseInline(text, { async: false }) as string;
      if (html !== text) {
        const span = document.createElement('span');
        span.innerHTML = html;
        node.parentNode?.replaceChild(span, node);
      }
    }
  } else {
    if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE') return;
    Array.from(node.childNodes).forEach(renderMarkdownInTextNodes);
  }
};

/**
 * Escape a bare `*` at the start of a line that is not part of:
 *   - a list bullet     (`* text` — asterisk + space)
 *   - a bold marker     (`**text` — two asterisks)
 *
 * Without this, `marked` opens an italic span that is never closed when all
 * subsequent `*` characters in the content are backslash-escaped (`\*`),
 * causing the remainder of the card to be swallowed by the broken emphasis.
 */
function escapeOrphanedLeadingAsterisk(text: string): string {
  // Match `*` at line-start that is NOT followed by another `*` or a space.
  return text.replace(/^(\*(?!\*| ))/gm, '\\$1');
}

/**
 * Converts a raw flashcard content string (Markdown + LaTeX) into sanitised
 * HTML ready to be passed to `dangerouslySetInnerHTML`.
 */
export const createMarkup = (content: string): { __html: string } => {
  // 1. Fix orphaned leading asterisks before markdown processing
  const normalised = escapeOrphanedLeadingAsterisk(content);

  // 2. Protect math and render with KaTeX before markdown touches it
  const mathRendered = renderMath(normalised);

  // 3. Block-level markdown pass
  const blockRendered = marked.parse(mathRendered, { async: false }) as string;

  // 4. Parse to DOM and apply inline markdown to every text node
  const doc = new DOMParser().parseFromString(blockRendered, 'text/html');
  renderMarkdownInTextNodes(doc.body);

  // 5. Sanitize — keep inline styles from Anki and KaTeX classes/styles
  return {
    __html: DOMPurify.sanitize(doc.body.innerHTML, {
      ADD_ATTR: ['style', 'aria-hidden'],
      ADD_TAGS: ['math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'msubsup', 'mover', 'munder', 'mspace'],
    }),
  };
};
