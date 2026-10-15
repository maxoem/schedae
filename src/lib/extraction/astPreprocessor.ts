import { unified } from "unified";
import remarkParse from "remark-parse";
import { toString } from "mdast-util-to-string";
import type { SimplifiedNode, PreprocessorResult, Stencil } from "./types";

// Simple in-memory cache keyed by the raw markdown string to avoid reparsing identical content.
const _preprocessCache = new Map<string, PreprocessorResult>();

// Parse markdown and assign stable numeric IDs to every node (pre-order).
export function preprocessMarkdown(markdown: string): PreprocessorResult {
  const key = String(markdown || "");
  const cached = _preprocessCache.get(key);
  if (cached) return cached;

  const tree: any = unified().use(remarkParse).parse(markdown);

  let nextId = 1;
  const nodes: SimplifiedNode[] = [];
  const idToNode: Record<number, any> = {};

  function extractText(node: any): string {
    if (!node) return "";
    try {
      // Use mdast-util-to-string for a deterministic human-visible text extraction
      return (toString(node) || "").toString();
    } catch {
      if (typeof node.value === "string") return node.value;
      if (Array.isArray(node.children)) return node.children.map((c: any) => extractText(c)).join(" ");
      return "";
    }
  }

  function traverse(node: any): number {
    const myId = nextId++;
    node.__id = myId;
    idToNode[myId] = node;

    const childIds: number[] = [];
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        childIds.push(traverse(child));
      }
    }

    const text = extractText(node);
    nodes.push({ id: myId, type: node.type, text, children: childIds });
    return myId;
  }

  traverse(tree);

  const result: PreprocessorResult = { root: tree, nodes, idToNode };
  try {
    _preprocessCache.set(key, result);
  } catch {
    // ignore cache set failures
  }

  return result;
}

// Compute the path (array of child indices) from `root` to node with `targetId`.
export function computePath(root: any, targetId: number): number[] {
  function search(node: any, path: number[]): number[] | null {
    if (!node) return null;
    if (node.__id === targetId) return path;
    if (!Array.isArray(node.children)) return null;
    for (let i = 0; i < node.children.length; i++) {
      const res = search(node.children[i], path.concat(i));
      if (res) return res;
    }
    return null;
  }

  const result = search(root, []);
  return result ?? [];
}

// Walk a root using the path (array of child indices) and return the landed node.
export function applyPath(root: any, path: number[]): any | null {
  let node = root;
  for (const idx of path) {
    if (!node || !Array.isArray(node.children) || node.children.length <= idx) return null;
    node = node.children[idx];
  }
  return node;
}

export function extractTextAtPath(root: any, path: number[]): string {
  const node = applyPath(root, path);
  if (!node) return "";
  try {
    return (toString(node) || "").toString();
  } catch {
    return (function collect(n: any): string {
      if (!n) return "";
      if (typeof n.value === "string") return n.value;
      if (Array.isArray(n.children)) return n.children.map(collect).join(" ");
      return "";
    })(node);
  }
}

export function buildStencilFromIds(root: any, frontNodeId: number, backNodeId: number): Stencil {
  return {
    front_path: computePath(root, frontNodeId),
    back_path: computePath(root, backNodeId),
    front_id: frontNodeId,
    back_id: backNodeId,
  };
}
