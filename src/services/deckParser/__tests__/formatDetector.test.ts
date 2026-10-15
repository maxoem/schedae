import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { FormatDetector } from "../heuristics/formatDetector";
import { DeckParserService } from "../deckParserService";

describe("FormatDetector Heuristic", () => {
  test("classifies hierarchical headings with custom fields", () => {
    const input = `# Card 1
## Front
What is Newton's First Law?
## Back
An object remains at rest unless acted upon by a force.
## Notes
Law of Inertia.
## Sources
Principia Mathematica
`;

    const detection = FormatDetector.detect(input);
    assert.equal(detection.patternId, "markdown-sections");
    assert.equal(detection.format, "markdown-sections");
    assert.equal(detection.hasCustomFields, true);
    assert.ok(detection.confidence >= 0.95);
  });

  test("classifies bullet list key-value cards with custom fields", () => {
    const input = `- Front: What is Newton's First Law?
- Back: An object remains at rest unless acted upon by a net force.
- Notes: Also known as Law of Inertia.
- Sources: Principia Mathematica

- Front: What is Newton's Second Law?
- Back: F = ma
- Notes: Force equals mass times acceleration.
`;

    const detection = FormatDetector.detect(input);
    assert.equal(detection.patternId, "bullet-list");
    assert.equal(detection.hasCustomFields, true);
    assert.ok(detection.confidence >= 0.9);
  });

  test("classifies JSON array cards", () => {
    const input = JSON.stringify([
      { front: "What is React?", back: "A UI library.", notes: "Maintained by Meta." },
    ]);

    const detection = FormatDetector.detect(input);
    assert.equal(detection.patternId, "json");
    assert.equal(detection.format, "json");
    assert.equal(detection.hasCustomFields, true);
    assert.ok(detection.confidence >= 0.98);
  });

  test("classifies flat markdown headings (###)", () => {
    const input = `### Question
What is the Halting Problem?
### Answer
It is undecidable.
`;

    const detection = FormatDetector.detect(input);
    assert.equal(detection.patternId, "markdown-headings");
    assert.equal(detection.format, "markdown-headings");
    assert.equal(detection.hasCustomFields, false);
  });

  test("classifies bold & italic delimiters", () => {
    const input = `**Question:** What is entropy?
**Answer:** Measure of disorder.
`;

    const detection = FormatDetector.detect(input);
    assert.equal(detection.patternId, "bold-italic");
    assert.ok(detection.confidence >= 0.9);
  });

  test("classifies unstructured text", () => {
    const input = `Just a plain note without flashcard structure or front/back markers.`;

    const detection = FormatDetector.detect(input);
    assert.equal(detection.patternId, "unknown");
    assert.equal(detection.format, "plain-text");
    assert.ok(detection.confidence < 0.5);
  });

  test("DeckParserService extracts bullet list cards with custom fields end-to-end", () => {
    const input = `- Front: What is the Speed of Light?
- Back: Approximately 299,792,458 m/s.
- Notes: Denoted by the symbol c in vacuum.
- Sources: Special Relativity (Einstein 1905)

- Front: What is Planck's Constant?
- Back: Approximately 6.626 x 10^-34 J*s.
- Notes: Quantum of electromagnetic action.
`;

    const res = DeckParserService.parse(input);
    assert.equal(res.success, true);
    assert.equal(res.cards.length, 2);

    const card1 = res.cards[0];
    assert.equal(card1.front, "What is the Speed of Light?");
    assert.equal(card1.back, "Approximately 299,792,458 m/s.");
    assert.ok(card1.customFields);
    assert.equal(card1.customFields["Notes"], "Denoted by the symbol c in vacuum.");
    assert.equal(card1.customFields["Sources"], "Special Relativity (Einstein 1905)");

    const card2 = res.cards[1];
    assert.equal(card2.front, "What is Planck's Constant?");
    assert.equal(card2.back, "Approximately 6.626 x 10^-34 J*s.");
    assert.ok(card2.customFields);
    assert.equal(card2.customFields["Notes"], "Quantum of electromagnetic action.");
  });
});
