import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  computeMarkdownHighlights,
  isJsonInput,
  PASTEL_PALETTES,
} from "../markdownHighlighter";

describe("MarkdownHighlighter", () => {
  test("JSON vs Markdown detection", () => {
    assert.strictEqual(isJsonInput(""), false);
    assert.strictEqual(isJsonInput("### Question\nWhat is 2+2?"), false);
    assert.strictEqual(isJsonInput('[{"front": "a", "back": "b"}]'), true);
    assert.strictEqual(isJsonInput('{\n  "front": "hello"\n}'), true);
  });

  test("Question header + body in ONE pastel color, Answer header + body in ONE pastel color", () => {
    const input = `### Question\nWhat is the halting problem?\n### Answer\nIt is undecidable.`;

    const runs = computeMarkdownHighlights(input);
    assert(runs.length >= 4, "Should have runs for question header, question body, answer header, answer body");

    const qHeaderRun = runs.find((r) => input.slice(r.offset, r.end) === "### Question");
    assert(qHeaderRun, "Must highlight ### Question");
    assert.strictEqual(qHeaderRun.className, PASTEL_PALETTES.question.header);

    const qBodyRun = runs.find((r) => input.slice(r.offset, r.end) === "What is the halting problem?");
    assert(qBodyRun, "Must highlight question body");
    assert.strictEqual(qBodyRun.className, PASTEL_PALETTES.question.body);

    const aHeaderRun = runs.find((r) => input.slice(r.offset, r.end) === "### Answer");
    assert(aHeaderRun, "Must highlight ### Answer");
    assert.strictEqual(aHeaderRun.className, PASTEL_PALETTES.answer.header);

    const aBodyRun = runs.find((r) => input.slice(r.offset, r.end) === "It is undecidable.");
    assert(aBodyRun, "Must highlight answer body");
    assert.strictEqual(aBodyRun.className, PASTEL_PALETTES.answer.body);

    assert(
      qHeaderRun.className.includes("bg-sky-100/60") && qBodyRun.className.includes("bg-sky-100/60"),
      "Question header and body must share sky pastel background",
    );
    assert(
      aHeaderRun.className.includes("bg-emerald-100/60") && aBodyRun.className.includes("bg-emerald-100/60"),
      "Answer header and body must share emerald pastel background",
    );
  });

  test("Custom fields (Notes, Sources) highlighted in distinct pastel colors", () => {
    const input = `### Card\n### Question\nWhat is Newton's First Law?\n### Answer\nLaw of Inertia\n### Notes\nFormulated in 1687.\n### Sources\nGoldstein Mechanics`;

    const runs = computeMarkdownHighlights(input);

    const cardRun = runs.find((r) => input.slice(r.offset, r.end) === "### Card");
    assert(cardRun, "Must highlight ### Card as separator");

    const notesHeaderRun = runs.find((r) => input.slice(r.offset, r.end) === "### Notes");
    assert(notesHeaderRun, "Must highlight ### Notes");
    const notesBodyRun = runs.find((r) => input.slice(r.offset, r.end) === "Formulated in 1687.");
    assert(notesBodyRun, "Must highlight Notes body");
    assert(
      notesHeaderRun.className.includes("bg-amber-100/60") && notesBodyRun.className.includes("bg-amber-100/60"),
      "Notes header and body must share amber pastel background",
    );

    const sourcesHeaderRun = runs.find((r) => input.slice(r.offset, r.end) === "### Sources");
    assert(sourcesHeaderRun, "Must highlight ### Sources");
    const sourcesBodyRun = runs.find((r) => input.slice(r.offset, r.end) === "Goldstein Mechanics");
    assert(sourcesBodyRun, "Must highlight Sources body");
    assert(
      sourcesHeaderRun.className.includes("bg-purple-100/60") && sourcesBodyRun.className.includes("bg-purple-100/60"),
      "Sources header and body must share purple pastel background",
    );
  });

  test("Math formulas seamlessly integrated into field pastel colors", () => {
    const input = `### Question\nWhat is the formula for \\( f(x) \\) around \\( a \\)?\n### Answer\n$$f(x) = x^2$$`;

    const runs = computeMarkdownHighlights(input);

    const qBodyRun = runs.find((r) => input.slice(r.offset, r.end) === "What is the formula for \\( f(x) \\) around \\( a \\)?");
    assert(qBodyRun, "Question body containing math should be highlighted as one unified run");
    assert.strictEqual(qBodyRun.className, PASTEL_PALETTES.question.body);

    const aBodyRun = runs.find((r) => input.slice(r.offset, r.end) === "$$f(x) = x^2$$");
    assert(aBodyRun, "Answer body containing display math should be highlighted as one unified run");
    assert.strictEqual(aBodyRun.className, PASTEL_PALETTES.answer.body);
  });

  test("Key-value / Bold question & answer format", () => {
    const input = `**Question:** What is TCP?\n**Answer:** Transmission Control Protocol.\n**Notes:** Connection-oriented.`;

    const runs = computeMarkdownHighlights(input);

    const qMarker = runs.find((r) => input.slice(r.offset, r.end) === "**Question:** ");
    assert(qMarker, "Must highlight **Question:** marker");
    const qBody = runs.find((r) => input.slice(r.offset, r.end) === "What is TCP?");
    assert(qBody, "Must highlight question body");
    assert(
      qMarker.className.includes("bg-sky-100/60") && qBody.className.includes("bg-sky-100/60"),
      "Key-value Question marker and body must share pastel sky background",
    );

    const aMarker = runs.find((r) => input.slice(r.offset, r.end) === "**Answer:** ");
    assert(aMarker, "Must highlight **Answer:** marker");
    const aBody = runs.find((r) => input.slice(r.offset, r.end) === "Transmission Control Protocol.");
    assert(aBody, "Must highlight answer body");
    assert(
      aMarker.className.includes("bg-emerald-100/60") && aBody.className.includes("bg-emerald-100/60"),
      "Key-value Answer marker and body must share pastel emerald background",
    );
  });
});
