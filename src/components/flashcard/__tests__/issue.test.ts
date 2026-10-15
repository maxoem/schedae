import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { extractFlashcardsFromText, PREDEFINED_EXTRACTION_SETS } from "../SplitSettingsDialog";

describe("extractFlashcardsFromText", () => {
	test("removes markdown card titles and label markers from front/back", () => {
		const md1 = `
# Karte 1: XY
## Frage
das ist die erste frage
## Antwort
das ist die erste antwort

# Karte 2: XY
## Frage
das ist die zweite frage
## Antwort
das ist die zweite antwort
`;

		const md2 = `
**Karte 1: XY**
*Frage:* abc
*Antwort:* def

**Karte 2: XY**
*Frage:* abd
*Antwort:* deg
`;

		const headingCards = extractFlashcardsFromText(md1, PREDEFINED_EXTRACTION_SETS[0]);
		assert.deepEqual(headingCards, [
			{
				front: "das ist die erste frage",
				back: "das ist die erste antwort",
			},
			{
				front: "das ist die zweite frage",
				back: "das ist die zweite antwort",
			},
		]);

		const boldItalicCards = extractFlashcardsFromText(md2, PREDEFINED_EXTRACTION_SETS[1]);
		assert.deepEqual(boldItalicCards, [
			{
				front: "abc",
				back: "def",
			},
			{
				front: "abd",
				back: "deg",
			},
		]);
	});
});
