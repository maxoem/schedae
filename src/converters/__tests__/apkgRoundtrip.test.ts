import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createApkg } from "../jsonToApkg";
import { apkgConverter } from "../apkg";
import type { FlashCard } from "../types";

describe("APKG Binary Round-Trip Verification", () => {
  const cards: FlashCard[] = [
    {
      front: "What is Fermat's Little Theorem?",
      back: "If $p$ is a prime and $a$ is an integer not divisible by $p$, then:\n\n$$a^{p-1} \\equiv 1 \\pmod{p}$$",
      customFields: {
        "Category": "Number Theory",
        "Quelle": "Hardy & Wright",
      },
    },
    {
      front: "What is Bayes' Theorem?",
      back: "P(A|B) = \\frac{P(B|A) P(A)}{P(B)}",
    },
  ];

  test("cards -> createApkg -> apkgConverter.convert preserves card content and structure", async () => {
    const deckName = "Test Mathematics Deck";
    const blob = await createApkg(cards, deckName, "markdown_basic");
    const arrayBuffer = await blob.arrayBuffer();

    assert.ok(arrayBuffer.byteLength > 0, "Generated APKG buffer must not be empty");

    const result = await apkgConverter.convert(arrayBuffer, `${deckName}.apkg`);

    assert.equal(result.cards.length, cards.length, "Decoded card count must match original");

    // Check front and back content
    assert.ok(result.cards[0].front.includes("Fermat's Little Theorem"));
    assert.ok(result.cards[0].back.includes("a^{p-1}"));
    assert.ok(result.cards[1].front.includes("Bayes' Theorem"));
    assert.ok(result.cards[1].back.includes("P(A|B)"));

    // Check custom fields
    assert.ok(result.cards[0].customFields, "Card 1 must retain customFields");
    assert.equal(result.cards[0].customFields?.["Category"], "Number Theory");
    assert.equal(result.cards[0].customFields?.["Quelle"], "Hardy & Wright");
  });
});
