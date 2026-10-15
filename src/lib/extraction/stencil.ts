import { preprocessMarkdown, extractTextAtPath, buildStencilFromIds, applyPath } from "./astPreprocessor";
import { analyzeAst, analyzeAstStream } from "./llmAdapter";
import { sanitizeExtractedString, sanitizeExtractedMarkdown } from "./sanitizer";
import type { Stencil, SimplifiedNode } from "./types";

export async function deriveStencilFromExampleMarkdown(markdown: string, opts?: any): Promise<Stencil> {
  // Remove manual card markers (%%%%) used only for the example seed.
  const cleaned = String(markdown || "").replace(/^\s*%{4,}\s*$/gm, "").trim();
  const pre = preprocessMarkdown(cleaned);
  // Filter out root node and tiny/empty nodes before asking the LLM.
  const nodes: SimplifiedNode[] = pre.nodes
    .filter((n) => n.type !== "root" && n.text && String(n.text).trim().length > 2)
    .map((n) => ({ id: n.id, type: n.type, text: n.text, children: n.children }));
  let res;
  if (opts && (typeof opts.onChunk === "function" || opts.signal)) {
    res = await analyzeAstStream(nodes, opts);
  } else {
    res = await analyzeAst(nodes, opts);
  }
  return buildStencilFromIds(pre.root, res.front_node_id, res.back_node_id);
}

export function applyStencilToMarkdown(markdown: string, stencil: Stencil) {
  // Strip any example-only markers (%%%%) and work on the cleaned chunk so offsets align.
  const cleaned = String(markdown || "").replace(/^\s*%{4,}\s*$/gm, "").trim();
  const pre = preprocessMarkdown(cleaned);

  // Try to locate the nodes and use their position offsets to slice the original markdown
  try {
    const frontNode = applyPath(pre.root, stencil.front_path || []);
    const backNode = applyPath(pre.root, stencil.back_path || []);

    if (frontNode && backNode && frontNode.position && backNode.position && typeof backNode.position.start?.offset === "number") {
      const backStart = backNode.position.start.offset;
      // Front is everything from the start of the chunk up to the back node (exclusive)
      let frontSlice = cleaned.slice(0, backStart).trim();
      // Guard: remove trailing orphan blockquote/marker characters that may have been captured
      frontSlice = frontSlice.replace(/(^|\n)\s*>\s*$/g, "").trim();
      // Back includes the back node and everything after
      const backSlice = cleaned.slice(backStart).trim();

      const front = sanitizeExtractedMarkdown(frontSlice);
      const back = sanitizeExtractedMarkdown(backSlice);
      return { front, back };
    }
  } catch {
    // fall through to the text-based fallback
  }

  // Fallback: extract individual nodes' text (less precise, may lose formatting)
  try {
    const frontRaw = extractTextAtPath(pre.root, stencil.front_path);
    const backRaw = extractTextAtPath(pre.root, stencil.back_path);
    let front = sanitizeExtractedString(frontRaw);
    const back = sanitizeExtractedString(backRaw);

    try {
      if (back && back.length > 10 && front.includes(back)) {
        front = front.replace(back, "").trim();
      }
    } catch {
      // ignore
    }

    return { front, back };
  } catch {
    return { front: "", back: "" };
  }
}
