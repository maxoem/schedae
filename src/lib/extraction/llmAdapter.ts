import type { SimplifiedNode } from "./types";

export interface LLMResult {
  front_node_id: number;
  back_node_id: number;
}

export interface LlmModelInfo {
  name: string;
  model: string;
  size?: number;
  digest?: string;
  details?: any;
  expires_at?: string;
  size_vram?: number;
  context_length?: number;
}

export async function listAvailableLlmModels(url = "http://localhost:11434/api/ps"): Promise<LlmModelInfo[]> {
  
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Failed to list models: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (!data || !Array.isArray(data.models)) return [];
  return data.models as LlmModelInfo[];
}

export async function analyzeAstStream(
  nodes: SimplifiedNode[],
  opts?: { url?: string; model?: string; maxTokens?: number; signal?: AbortSignal; onChunk?: (chunk: string) => void; stream?: boolean }
): Promise<LLMResult> {
  const url = opts?.url ?? "http://localhost:11434/api/generate";

    const systemPrompt = `You are a headless structural analysis engine. Analyze a simplified JSON Abstract Syntax Tree (AST) and return the integer node IDs for the card FRONT (question) and BACK (answer).\n\nIMPORTANT RULES:\n1) OUTPUT EXACTLY ONE JSON OBJECT AND NOTHING ELSE — no explanation, no code fences, no extra text.\n2) The JSON must match this schema exactly: {"front_node_id": <integer>, "back_node_id": <integer>}\n3) If you cannot reliably identify a node, return -1 for that field.\n4) Do NOT output any intermediate "thinking" or step-by-step reasoning — only the final JSON.\n5) Prefer nodes whose \`text\` contains the main human-visible content (paragraphs, list items, text nodes). If multiple candidates exist, choose the node with the longest \`text\` content.\n6) DO NOT return the document root node (type 'root') or its id. Only return node ids with types such as 'paragraph', 'listItem', 'heading', 'text', or 'blockquote'. If the root is the only candidate, return -1 for that field.\n\nExample (exact output format): {"front_node_id": 14, "back_node_id": 27}`;

    const userPrompt = `Analyze the following simplified AST nodes representing a single flashcard. Each node is an object with {id, type, text}. Return ONLY the one-line JSON object with the two integer fields 'front_node_id' and 'back_node_id'. Do NOT add any extra text.\n\n${JSON.stringify(
      nodes.map((n) => ({ id: n.id, type: n.type, text: n.text })),
      null,
      2
    )}`;

  const fullPrompt = systemPrompt + "\n\n" + userPrompt;
  const body = {
    model: opts?.model ?? "llama",
    prompt: fullPrompt,
    max_tokens: opts?.maxTokens ?? 512,
    stream: opts?.stream ?? false,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: opts?.signal,
  });

  if (!res.ok) throw new Error(`LLM request failed: ${res.status} ${res.statusText}`);
  // Read full response body (stream or non-stream) and build a single final answer string
  const decoder = new TextDecoder();
  let accumulated = "";

  if (!res.body) {
    accumulated = await res.text();
  } else {
    const reader = res.body.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          accumulated += decoder.decode(value, { stream: true });
        }
      }
    } catch (err) {
      throw err;
    }
  }

  // Helper: extract all top-level JSON object substrings from the accumulated text
  function extractAllJsonObjects(text: string): string[] {
    const results: string[] = [];
    let i = 0;
    while (i < text.length) {
      const start = text.indexOf("{", i);
      if (start === -1) break;
      let depth = 0;
      let end = -1;
      for (let j = start; j < text.length; j++) {
        const ch = text[j];
        if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (depth === 0) {
            end = j;
            break;
          }
        }
      }
      if (end === -1) break;
      results.push(text.substring(start, end + 1));
      i = end + 1;
    }
    return results;
  }

  // Build the final human-facing answer string by extracting known text fields
  const jsonObjects = extractAllJsonObjects(accumulated);
  const answerParts: string[] = [];
  const parsedJsons: any[] = [];
  for (const js of jsonObjects) {
    try {
      const p = JSON.parse(js);
      parsedJsons.push(p);
      if (p && typeof p === "object") {
        if (typeof p.thinking === "string" && p.thinking.trim()) answerParts.push(p.thinking);
        else if (typeof p.response === "string" && p.response.trim()) answerParts.push(p.response);
        else if (typeof p.text === "string" && p.text.trim()) answerParts.push(p.text);
        else if (typeof p.content === "string" && p.content.trim()) answerParts.push(p.content);
      }
    } catch {
      // ignore
    }
  }

  const llmAnswerStr = answerParts.length > 0 ? answerParts.join("") : accumulated.trim();

  // Notify caller with the final assembled LLM answer (only once)
  try {
    if (opts?.onChunk) opts.onChunk(llmAnswerStr);
  } catch (e) {
    // ignore callback errors
  }
  // Try to parse the assembled LLM answer string as JSON (handles cases where the model
  // streams inner JSON fragments inside wrapper objects' `response` fields).
  let parsedResult: any = null;

  const tryParseCandidate = (candidate: string): any | null => {
    try {
      let s: any = candidate.trim();

      // Unwrap repeatedly if the candidate is a quoted JSON string like "{...}"
      let unwrapCount = 0;
      while (typeof s === "string" && s.startsWith("\"") && s.endsWith("\"") && unwrapCount < 5) {
        try {
          s = JSON.parse(s);
          unwrapCount++;
        } catch {
          break;
        }
      }

      // If we end up with a string that contains JSON, extract the first JSON object
      if (typeof s === "string") {
        const inner = extractFirstJson(s) ?? s;
        const parsed = JSON.parse(inner);
        if (Number.isInteger(parsed.front_node_id) && Number.isInteger(parsed.back_node_id)) return parsed;
      }

      // If s is already an object, check directly
      if (typeof s === "object" && s !== null) {
        if (Number.isInteger(s.front_node_id) && Number.isInteger(s.back_node_id)) return s;
      }
    } catch {
      // ignore parse errors
    }
    return null;
  };

  // Primary: try parsing the assembled answer string
  parsedResult = tryParseCandidate(llmAnswerStr);

  // Secondary: if that failed, try parsing any `response` fields we collected from the stream
  if (!parsedResult && answerParts.length > 0) {
    const joined = answerParts.join("");
    parsedResult = tryParseCandidate(joined);
  }

  // Tertiary: check any top-level parsed JSONs for the schema
  if (!parsedResult) {
    for (const p of parsedJsons) {
      if (p && Number.isInteger(p.front_node_id) && Number.isInteger(p.back_node_id)) {
        parsedResult = p;
        break;
      }
      // If wrapper object contains a `response` string, try parsing that
      if (p && typeof p.response === "string") {
        const maybe = tryParseCandidate(p.response);
        if (maybe) {
          parsedResult = maybe;
          break;
        }
      }
    }
  }

  // Final fallback: try to extract any JSON object from the raw accumulated text
  if (!parsedResult) {
    const json = extractFirstJson(accumulated);
    if (!json) throw new Error("Could not extract JSON from LLM response.");
    try {
      const parsed = JSON.parse(json);
      if (!Number.isInteger(parsed.front_node_id) || !Number.isInteger(parsed.back_node_id)) {
        throw new Error("LLM returned invalid schema.");
      }
      parsedResult = parsed;
    } catch (err) {
      throw new Error("Failed to parse LLM JSON response: " + String(err));
    }
  }

  return parsedResult as LLMResult;
}

function extractFirstJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return text.substring(start, i + 1);
      }
    }
  }
  return null;
}

export async function analyzeAstWithOllama(
  nodes: SimplifiedNode[],
  opts?: { url?: string; model?: string; maxTokens?: number; stream?: boolean }
): Promise<LLMResult> {
  const url = opts?.url ?? "http://localhost:11434/api/generate";
  const systemPrompt = `You are a headless structural analysis engine. Analyze a simplified JSON Abstract Syntax Tree (AST) and return the integer node IDs for the card FRONT (question) and BACK (answer).\n\nIMPORTANT RULES:\n1) OUTPUT EXACTLY ONE JSON OBJECT AND NOTHING ELSE — no explanation, no code fences, no extra text.\n2) The JSON must match this schema exactly: {"front_node_id": <integer>, "back_node_id": <integer>}\n3) If you cannot reliably identify a node, return -1 for that field.\n4) Do NOT output any intermediate "thinking" or step-by-step reasoning — only the final JSON.\n5) Prefer nodes whose \`text\` contains the main human-visible content (paragraphs, list items, text nodes). If multiple candidates exist, choose the node with the longest \`text\` content.\n6) DO NOT return the document root node (type 'root') or its id. Only return node ids with types such as 'paragraph', 'listItem', 'heading', 'text', or 'blockquote'. If the root is the only candidate, return -1 for that field.\n\nExample (exact output format): {"front_node_id": 14, "back_node_id": 27}`;

  const userPrompt = `Analyze the following simplified AST nodes representing a single flashcard. Each node is an object with {id, type, text}. Return ONLY the one-line JSON object with the two integer fields 'front_node_id' and 'back_node_id'. Do NOT add any extra text.\n\n${JSON.stringify(
    nodes.map((n) => ({ id: n.id, type: n.type, text: n.text })),
    null,
    2
  )}`;

  const fullPrompt = systemPrompt + "\n\n" + userPrompt;
  const body = {
    model: opts?.model ?? "llama",
    prompt: fullPrompt,
    max_tokens: opts?.maxTokens ?? 512,
    stream: opts?.stream ?? false,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`LLM request failed: ${res.status} ${res.statusText}`);

  const text = await res.text();
  const json = extractFirstJson(text);
  if (!json) throw new Error("Could not extract JSON from LLM response.");

  try {
    const parsedWrapper = JSON.parse(json);

    // If the wrapper already contains the schema, return it
    if (Number.isInteger(parsedWrapper.front_node_id) && Number.isInteger(parsedWrapper.back_node_id)) {
      return parsedWrapper as LLMResult;
    }

    // If the wrapper has a `response` string, attempt to parse it (handles nested JSON returned as a string)
    if (typeof parsedWrapper.response === "string") {
      try {
        // unwrap quoted JSON string if necessary
        let candidate: any = parsedWrapper.response;
        if (typeof candidate === "string") {
          try {
            // If it's a quoted JSON string, JSON.parse will unescape it
            candidate = JSON.parse(candidate);
          } catch {
            // ignore
          }
        }
        const innerJson = typeof candidate === "string" ? (extractFirstJson(candidate) ?? candidate) : JSON.stringify(candidate);
        const parsed = JSON.parse(innerJson);
        if (Number.isInteger(parsed.front_node_id) && Number.isInteger(parsed.back_node_id)) {
          return parsed as LLMResult;
        }
      } catch {
        // fall through to error below
      }
    }

    throw new Error("LLM returned invalid schema.");
  } catch (err) {
    throw new Error("Failed to parse LLM JSON response: " + String(err));
  }
}

export async function analyzeAst(
  nodes: SimplifiedNode[],
  opts?: { url?: string; model?: string; maxTokens?: number }
) {
  return analyzeAstWithOllama(nodes, opts);
}
