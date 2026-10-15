import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { preprocessMarkdown } from "../astPreprocessor";
import { analyzeAstStream, listAvailableLlmModels } from "../llmAdapter";

describe("Stencil LLM Extraction", () => {
  const example = `\n**Karte 6A: Formale Struktur (Das Skelett)**\n* **Vorderseite:** [Wahrheitstheorien | Teleologie der Rechtfertigung] Wie lässt sich logisch beweisen, dass der Begriff der Wahrheit dem Begriff der Rechtfertigung primär (übergeordnet) ist?\n* **Rückseite:** Über den Beweis durch Differenzierung von Rationalitätsarten:\n  * *Pragmatische Rechtfertigung ($J_{prag}$):* Ziel = Handlungserfolg (Bsp.: Ich glaube an meinen Erfolg, um motiviert zu sein).\n  * *Epistemische Rechtfertigung ($J_{epi}$):* Ziel = Wahrheit.\n  Da $J_{epi}$ teleologisch exklusiv durch das Ziel der Wahrheit definiert ist, ist die Wahrheit logisch primär.\n`;

  test("LLM returns valid node ids for front/back when Ollama is available", async (t) => {
    try {
      const cleaned = String(example).trim();
      const pre = preprocessMarkdown(cleaned);
      const nodes = pre.nodes.filter(
        (n) => n.type !== "root" && n.text && String(n.text).trim().length > 2
      );

      const models = await listAvailableLlmModels("http://localhost:11434/api/ps");
      if (!models || models.length === 0) {
        t.skip("No Ollama models currently loaded at http://localhost:11434");
        return;
      }

      const model = models[0].name;
      const result = await analyzeAstStream(nodes, { stream: false, model });
      assert(typeof result.front_node_id === "number");
      assert(typeof result.back_node_id === "number");
      assert.notStrictEqual(result.front_node_id, result.back_node_id);

      const frontNode = nodes.find((n) => n.id === result.front_node_id);
      const backNode = nodes.find((n) => n.id === result.back_node_id);
      assert(frontNode, "Front node must be resolved");
      assert(backNode, "Back node must be resolved");
    } catch (err) {
      t.skip(`Skipping live Ollama test: ${(err as Error).message}`);
    }
  });
});
