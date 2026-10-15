import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { CARD_TEMPLATES } from "../templates";
import { formatMarkdownForAnki } from "../jsonToApkg";
import { normalizeMathMarkdown } from "../../utils/mathUtils";

describe("Markdown & KaTeX Template Rendering", () => {
  test("CARD_TEMPLATES.markdown_basic includes LaTeX delimiters \\( and \\[", () => {
    const qfmt = CARD_TEMPLATES.markdown_basic.qfmt;
    assert.ok(qfmt.includes('left: "\\\\("'), "Front template must include inline \\( delimiter");
    assert.ok(qfmt.includes('left: "\\\\["'), "Front template must include display \\[ delimiter");
    assert.ok(qfmt.includes('left: "$$"'), "Front template must include display $$ delimiter");
    assert.ok(qfmt.includes('left: "$"'), "Front template must include inline $ delimiter");
  });

  test("CARD_TEMPLATES.markdown_basic script cleans up Anki MathJax tags, double backslashes, and list <br> spacing", () => {
    const qfmt = CARD_TEMPLATES.markdown_basic.qfmt;
    assert.ok(qfmt.includes("anki-mathjax"), "Template should handle anki-mathjax tags");
    assert.ok(qfmt.includes("replaceHTMLElementsInString"), "Template should decode HTML entities");
    assert.ok(qfmt.includes("[*+-]"), "Template should normalize list markers");
  });

  test("CARD_TEMPLATES.markdown_basic back template queries and renders custom fields like Quelle", () => {
    const afmt = CARD_TEMPLATES.markdown_basic.afmt;
    assert.ok(afmt.includes(".md-custom-field"), "Back template must target .md-custom-field elements");
    assert.ok(afmt.includes("renderAllBackFields"), "Back template must have a function to render all back fields");
    assert.ok(afmt.includes("data-rendered"), "Back template should prevent double-rendering via data-rendered attribute");
  });

  test("CARD_TEMPLATES.markdown_basic CSS includes custom field and dark mode styles", () => {
    const css = CARD_TEMPLATES.markdown_basic.css;
    assert.ok(css.includes(".custom-field"), "CSS should include .custom-field styling");
    assert.ok(css.includes(".md-custom-field"), "CSS should include .md-custom-field styling");
    assert.ok(css.includes(".katex-display"), "CSS should style .katex-display");
    assert.ok(css.includes(".nightMode"), "CSS should support night mode");
  });

  test("formatMarkdownForAnki correctly formats list items and strips accidental sub-bullet indents", () => {
    // 1. Two top-level bullet items with empty line and trailing whitespace
    const inputWithEmptyLine =
      "* **Hoher Bias (Underfitting):** Sowohl Trainings- als auch Testfehler sind hoch. \n\n" +
      "* **Hohe Varianz (Overfitting):** Trainingsfehler ist sehr niedrig, aber Testfehler ist hoch.";

    const formatted = formatMarkdownForAnki(inputWithEmptyLine);
    assert.equal(
      formatted,
      "* **Hoher Bias (Underfitting):** Sowohl Trainings- als auch Testfehler sind hoch.<br><br>" +
      "* **Hohe Varianz (Overfitting):** Trainingsfehler ist sehr niedrig, aber Testfehler ist hoch."
    );

    // 2. Existing <br> tag with space before bullet (*...<br> *...) is normalized
    const inputWithBrSpace =
      "* **Hoher Bias:** Fehler hoch.<br> * **Hohe Varianz:** Fehler niedrig.";
    const formattedBr = formatMarkdownForAnki(inputWithBrSpace);
    assert.equal(
      formattedBr,
      "* **Hoher Bias:** Fehler hoch.<br>* **Hohe Varianz:** Fehler niedrig."
    );

    // 3. Accidental single-space indent before bullet is trimmed to column 0
    const inputWithSingleSpace =
      "* Item 1\n * Item 2 (accidental single space indent)";
    const formattedSingleSpace = formatMarkdownForAnki(inputWithSingleSpace);
    assert.equal(
      formattedSingleSpace,
      "* Item 1<br>* Item 2 (accidental single space indent)"
    );

    // 4. Intentional sub-bullets (2 or 4 spaces) are preserved
    const inputWithSubList =
      "* Parent item\n  * Child item (2 spaces)\n    * Sub-child item (4 spaces)";
    const formattedSubList = formatMarkdownForAnki(inputWithSubList);
    assert.equal(
      formattedSubList,
      "* Parent item<br>  * Child item (2 spaces)<br>    * Sub-child item (4 spaces)"
    );
  });

  test("normalizeMathMarkdown handles LaTeX and Anki MathJax delimiters", () => {
    // Inline math
    const inline = "Ein Programm lernt aus Erfahrung \\(E\\) bezüglich Aufgaben \\(T\\)";
    const normInline = normalizeMathMarkdown(inline);
    assert.equal(normInline, "Ein Programm lernt aus Erfahrung $E$ bezüglich Aufgaben $T$");

    // Display math
    const display = "\\[\\text{KI} \\supset \\text{ML}\\]";
    const normDisplay = normalizeMathMarkdown(display);
    assert.ok(normDisplay.includes("$$\\text{KI} \\supset \\text{ML}$$"));

    // Anki mathjax tag
    const ankiTag = "Erfahrung <anki-mathjax>E</anki-mathjax> bezüglich";
    const normAnki = normalizeMathMarkdown(ankiTag);
    assert.equal(normAnki, "Erfahrung $E$ bezüglich");

    // Anki mathjax tag with stray backslashes
    const ankiStray = "Erfahrung \\<anki-mathjax>E\\</anki-mathjax> bezüglich";
    const normAnkiStray = normalizeMathMarkdown(ankiStray);
    assert.equal(normAnkiStray, "Erfahrung $E$ bezüglich");

    // Double-escaped \\(E\\)
    const doubleEscaped = "Erfahrung \\\\(E\\\\) bezüglich";
    const normDouble = normalizeMathMarkdown(doubleEscaped);
    assert.equal(normDouble, "Erfahrung $E$ bezüglich");
  });
});
