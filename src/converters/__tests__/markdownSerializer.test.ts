import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { cardsToMarkdown } from "../markdownSerializer";
import { DeckParserService } from "@/services/deckParser/deckParserService";
import type { FlashCard } from "../types";

describe("Markdown Serializer & Bijective Round-Trip", () => {
  const sampleCards: FlashCard[] = [
    {
      front: "What is the Halting Problem?",
      back: "A decision problem proven undecidable by Alan Turing in 1936.",
      customFields: {
        "Notes": "Key result in computability theory.",
        "Quelle(n)": "Sipser, Introduction to the Theory of Computation",
      },
    },
    {
      front: "What is Euler's Identity?",
      back: "$$e^{i\\pi} + 1 = 0$$\n\nConnects five fundamental mathematical constants.",
      customFields: {
        "Category": "Mathematics",
      },
    },
  ];

  test("serializes flashcards into canonical markdown headers", () => {
    const md = cardsToMarkdown(sampleCards);

    assert.ok(md.includes("# Card 1"));
    assert.ok(md.includes("## Front\n\nWhat is the Halting Problem?"));
    assert.ok(md.includes("## Back\n\nA decision problem proven undecidable by Alan Turing in 1936."));
    assert.ok(md.includes("## Notes\n\nKey result in computability theory."));
    assert.ok(md.includes("## Quelle(n)\n\nSipser, Introduction to the Theory of Computation"));
    assert.ok(md.includes("---"));
    assert.ok(md.includes("# Card 2"));
    assert.ok(md.includes("## Category\n\nMathematics"));
  });

  test("returns empty string for empty cards array", () => {
    assert.equal(cardsToMarkdown([]), "");
  });

  test("bijective round-trip: cards -> markdown -> cards yields identical cards", () => {
    const markdown = cardsToMarkdown(sampleCards);
    const parseResult = DeckParserService.parse(markdown);

    assert.equal(parseResult.success, true);
    assert.equal(parseResult.cards.length, sampleCards.length);

    for (let i = 0; i < sampleCards.length; i++) {
      const original = sampleCards[i];
      const parsed = parseResult.cards[i];

      assert.equal(parsed.front.trim(), original.front.trim(), `Card #${i + 1} front mismatch`);
      assert.equal(parsed.back.trim(), original.back.trim(), `Card #${i + 1} back mismatch`);

      if (original.customFields) {
        assert.ok(parsed.customFields, `Card #${i + 1} should have customFields`);
        for (const [key, val] of Object.entries(original.customFields)) {
          assert.equal(
            parsed.customFields?.[key]?.trim(),
            val.trim(),
            `Card #${i + 1} custom field '${key}' mismatch`
          );
        }
      }
    }
  });

  test("idempotence: parse(serialize(parse(serialize(cards)))) === cards", () => {
    const md1 = cardsToMarkdown(sampleCards);
    const parsed1 = DeckParserService.parse(md1).cards;

    const md2 = cardsToMarkdown(parsed1);
    const parsed2 = DeckParserService.parse(md2).cards;

    assert.equal(md1, md2, "Generated markdown should be strictly idempotent across iterations");
    assert.deepEqual(parsed1, parsed2, "Parsed cards must be strictly idempotent");
  });
});
