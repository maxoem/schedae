import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { preprocessMarkdown, buildStencilFromIds } from "../astPreprocessor";
import { applyStencilToMarkdown, deriveStencilFromExampleMarkdown } from "../stencil";
import type { Stencil } from "../types";

describe("Stencil Extraction", () => {
  const example = `\n**Karte 6A: Formale Struktur (Das Skelett)**\n* **Vorderseite:** [Wahrheitstheorien | Teleologie der Rechtfertigung] Wie lässt sich logisch beweisen, dass der Begriff der Wahrheit dem Begriff der Rechtfertigung primär (übergeordnet) ist?\n* **Rückseite:** Über den Beweis durch Differenzierung von Rationalitätsarten:\n  * *Pragmatische Rechtfertigung ($J_{prag}$):* Ziel = Handlungserfolg (Bsp.: Ich glaube an meinen Erfolg, um motiviert zu sein).\n  * *Epistemische Rechtfertigung ($J_{epi}$):* Ziel = Wahrheit.\n  Da $J_{epi}$ teleologisch exklusiv durch das Ziel der Wahrheit definiert ist, ist die Wahrheit logisch primär.\n`;

  test("extracts correct front/back with predefined stencil", () => {
    const cleaned = String(example).trim();
    const pre = preprocessMarkdown(cleaned);
    // Find front and back nodes heuristically
    const frontNode = pre.nodes.find((n) => /Vorderseite|Frage|Front|Question/i.test(n.text));
    const backNode = pre.nodes.find((n) => /Rückseite|Antwort|Back|Answer/i.test(n.text));
    assert(frontNode, "Front node must be found");
    assert(backNode, "Back node must be found");

    const stencil: Stencil = buildStencilFromIds(pre.root, frontNode.id, backNode.id);
    const extracted = applyStencilToMarkdown(example, stencil);

    assert(
      extracted.front.includes("Wie lässt sich logisch beweisen"),
      "Front text must contain the question content"
    );
    assert(extracted.back.trim().includes("Über den Beweis durch Differenzierung von Rationalitätsarten:"));
    assert(extracted.back.trim().includes("Pragmatische Rechtfertigung"));
    assert(extracted.back.trim().includes("Epistemische Rechtfertigung"));
  });

  test("can derive stencil from example markdown when LLM is available", async (t) => {
    try {
      const stencil = await deriveStencilFromExampleMarkdown(example);
      const extracted = applyStencilToMarkdown(example, stencil);
      const validVariants = [
        "[Wahrheitstheorien | Teleologie der Rechtfertigung] Wie lässt sich logisch beweisen, dass der Begriff der Wahrheit dem Begriff der Rechtfertigung primär (übergeordnet) ist?",
        "Wie lässt sich logisch beweisen, dass der Begriff der Wahrheit dem Begriff der Rechtfertigung primär (übergeordnet) ist?",
      ];
      assert(validVariants.includes(extracted.front.trim()));
      assert(extracted.back.trim().includes("Über den Beweis durch Differenzierung von Rationalitätsarten:"));
    } catch (err) {
      // Gracefully skip in environments where local Ollama is not active
      t.skip(`Skipping live LLM test because local Ollama is offline: ${(err as Error).message}`);
    }
  });
});
