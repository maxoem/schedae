import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { DeckParserService } from "../deckParserService";
import { WORKSPACE_SAMPLES } from "../sampleData";

describe("DeckParserService", () => {
  test("extracts markdown Q&A cards cleanly", () => {
    const input = `
### Question
What is the Halting Problem?
### Answer
It is an undecidable problem proven by Alan Turing.

### Question
What is P vs NP?
### Answer
It asks whether every problem whose solution can be verified quickly can also be solved quickly.
`;

    const result = DeckParserService.parse(input);
    assert.equal(result.success, true);
    assert.equal(result.cards.length, 2);
    assert.equal(result.cards[0].front, "What is the Halting Problem?");
    assert.equal(result.cards[0].back, "It is an undecidable problem proven by Alan Turing.");
    assert.equal(result.detectedFormat, "markdown-headings");
  });

  test("extracts JSON cards cleanly", () => {
    const input = JSON.stringify([
      { front: "Capital of France?", back: "Paris" },
      { front: "Capital of Japan?", back: "Tokyo" },
    ]);

    const result = DeckParserService.parse(input);
    assert.equal(result.success, true);
    assert.equal(result.cards.length, 2);
    assert.equal(result.cards[0].front, "Capital of France?");
    assert.equal(result.cards[0].back, "Paris");
    assert.equal(result.detectedFormat, "json");
  });

  test("extracts JSON wrapped in markdown code blocks", () => {
    const input = `\`\`\`json
[
  { "front": "2 + 2?", "back": "4" }
]
\`\`\``;

    const result = DeckParserService.parse(input);
    assert.equal(result.success, true);
    assert.equal(result.cards.length, 1);
    assert.equal(result.cards[0].front, "2 + 2?");
    assert.equal(result.cards[0].back, "4");
  });

  test("returns empty result on empty input without throwing", () => {
    const result = DeckParserService.parse("   ");
    assert.equal(result.success, true);
    assert.equal(result.cards.length, 0);
    assert.equal(result.detectedFormat, "empty");
  });

  test("normalizes Google Gemini citation tags", () => {
    const input = `
### Question
What is Gemini?[cite_start][1, 2][cite_end]
### Answer
An AI model family.
`;

    const result = DeckParserService.parse(input, { normalizeModel: "gemini" });
    assert.equal(result.success, true);
    assert.equal(result.cards.length, 1);
    assert.ok(!result.cards[0].front.includes("[cite_start]"));
  });

  test("all workspace sample datasets parse successfully", () => {
    for (const sample of WORKSPACE_SAMPLES) {
      const res = DeckParserService.parse(sample.content);
      assert.equal(res.success, true, `Sample ${sample.id} should succeed`);
      assert.ok(res.cards.length > 0, `Sample ${sample.id} should yield at least 1 card`);
    }
  });

  test("extracts cards with custom fields (Notes, Sources) from hierarchical headings", () => {
    const input = `
# Card 1
## Front
What is Newton's First Law of Motion?
## Back
An object remains at rest or in uniform motion unless acted upon by a net force.
## Notes
Also known as the Law of Inertia. First formulated in Principia (1687).
## Sources
Classical Mechanics - Goldstein

# Card 2
## Front
What is Newton's Second Law?
## Back
F = ma
## Notes
Force equals rate of change of momentum.
`;

    const result = DeckParserService.parse(input);
    assert.equal(result.success, true);
    assert.equal(result.cards.length, 2);
    assert.equal(result.detectedFormat, "markdown-sections");

    const card1 = result.cards[0];
    assert.equal(card1.front, "What is Newton's First Law of Motion?");
    assert.equal(card1.back, "An object remains at rest or in uniform motion unless acted upon by a net force.");
    assert.ok(card1.customFields);
    assert.equal(card1.customFields["Notes"], "Also known as the Law of Inertia. First formulated in Principia (1687).");
    assert.equal(card1.customFields["Sources"], "Classical Mechanics - Goldstein");

    const card2 = result.cards[1];
    assert.equal(card2.front, "What is Newton's Second Law?");
    assert.equal(card2.back, "F = ma");
    assert.ok(card2.customFields);
    assert.equal(card2.customFields["Notes"], "Force equals rate of change of momentum.");
    assert.equal(card2.customFields["Sources"], undefined);
  });

  test("extracts custom fields from JSON format", () => {
    const input = JSON.stringify([
      {
        front: "What is photosynthesis?",
        back: "Process converting light into chemical energy.",
        notes: "Occurs in chloroplasts.",
        sources: "Campbell Biology",
      },
    ]);

    const result = DeckParserService.parse(input);
    assert.equal(result.success, true);
    assert.equal(result.cards.length, 1);
    assert.equal(result.cards[0].front, "What is photosynthesis?");
    assert.equal(result.cards[0].back, "Process converting light into chemical energy.");
    assert.ok(result.cards[0].customFields);
    assert.equal(result.cards[0].customFields["notes"], "Occurs in chloroplasts.");
    assert.equal(result.cards[0].customFields["sources"], "Campbell Biology");
  });

  describe("Extractor Registry & Auto-Detection Default", () => {
    test("registers auto-detection as default extractor", () => {
      const defaultExtractor = DeckParserService.getDefaultExtractor();
      assert.equal(defaultExtractor.id, "auto");
      assert.equal(defaultExtractor.label, "✨ Auto-Detect Format");
    });

    test("contains all specialized extractors in registry", () => {
      const extractors = DeckParserService.getRegisteredExtractors();
      const ids = extractors.map((e) => e.id);
      assert.ok(ids.includes("auto"));
      assert.ok(ids.includes("json"));
      assert.ok(ids.includes("markdown-sections"));
      assert.ok(ids.includes("key-value"));
      assert.ok(ids.includes("stencil"));
      assert.ok(ids.includes("regex"));
    });

    test("allows registering custom extractor extension (Open-Closed Principle)", () => {
      const customExtractor = {
        id: "mock-custom-strategy",
        label: "Mock Strategy",
        canExtract: (t: string) => t.includes("[MOCK]"),
        extract: (t: string) => ({
          cards: [{ front: "Mock Front", back: "Mock Back" }],
          matchedStrategy: "mock-custom-strategy",
          diagnostics: [],
        }),
      };

      DeckParserService.registerExtractor(customExtractor);
      const retrieved = DeckParserService.getExtractor("mock-custom-strategy");
      assert.equal(retrieved?.id, "mock-custom-strategy");

      const result = DeckParserService.parse("[MOCK] card data", { extractorId: "mock-custom-strategy" });
      assert.equal(result.success, true);
      assert.equal(result.cards[0].front, "Mock Front");
      assert.equal(result.usedStrategyId, "mock-custom-strategy");
    });
  });
});

