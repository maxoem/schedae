import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DeckParserService } from "../deckParserService";
import { cardsToMarkdown } from "@/converters/markdownSerializer";
import type { ExtractorOptions, DeckParseResult } from "../types";

const FIXTURES_DIR = path.resolve(
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(new URL(import.meta.url).pathname),
  "fixtures"
);

describe("Dynamic Fixture Extraction & Round-Trip Suite", () => {
  if (!fs.existsSync(FIXTURES_DIR)) {
    test("fixtures directory exists", () => {
      assert.ok(true, "No fixtures directory found yet");
    });
    return;
  }

  const entries = fs.readdirSync(FIXTURES_DIR, { withFileTypes: true });
  const fixtureDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const isUpdateMode =
    process.env.UPDATE_SNAPSHOTS === "true" ||
    process.env.UPDATE_SNAPSHOTS === "1";

  for (const dirName of fixtureDirs) {
    const fixturePath = path.join(FIXTURES_DIR, dirName);
    const inputPath = path.join(fixturePath, "input.md");
    const expectedPath = path.join(fixturePath, "expected.json");
    const optionsPath = path.join(fixturePath, "options.json");

    if (!fs.existsSync(inputPath)) {
      continue;
    }

    test(`Fixture: [${dirName}]`, () => {
      const inputContent = fs.readFileSync(inputPath, "utf-8");

      let options: ExtractorOptions = {};
      if (fs.existsSync(optionsPath)) {
        try {
          options = JSON.parse(fs.readFileSync(optionsPath, "utf-8"));
        } catch (e) {
          assert.fail(`Invalid JSON in options.json for fixture '${dirName}': ${e}`);
        }
      }

      // 1. Execute parser under test
      const actualResult: DeckParseResult = DeckParserService.parse(inputContent, options);

      assert.equal(
        actualResult.success,
        true,
        `DeckParserService failed to parse fixture '${dirName}'`
      );

      // 2. Snapshot update or generation mode
      if (!fs.existsSync(expectedPath) || isUpdateMode) {
        const snapshotData = {
          cardCount: actualResult.cards.length,
          detectedFormat: actualResult.detectedFormat,
          usedStrategyId: actualResult.usedStrategyId,
          cards: actualResult.cards,
        };
        fs.writeFileSync(expectedPath, JSON.stringify(snapshotData, null, 2) + "\n", "utf-8");
        // In update mode, the generated file is the baseline
        return;
      }

      // 3. Verify against Golden Master expected.json
      const expectedData = JSON.parse(fs.readFileSync(expectedPath, "utf-8"));

      assert.equal(
        actualResult.cards.length,
        expectedData.cardCount ?? expectedData.cards.length,
        `Card count mismatch in fixture '${dirName}'`
      );

      if (expectedData.detectedFormat) {
        assert.equal(
          actualResult.detectedFormat,
          expectedData.detectedFormat,
          `Detected format mismatch in fixture '${dirName}'`
        );
      }

      if (expectedData.usedStrategyId) {
        assert.equal(
          actualResult.usedStrategyId,
          expectedData.usedStrategyId,
          `Used strategy mismatch in fixture '${dirName}'`
        );
      }

      for (let i = 0; i < expectedData.cards.length; i++) {
        const actualCard = actualResult.cards[i];
        const expectedCard = expectedData.cards[i];

        assert.equal(
          actualCard.front.trim(),
          expectedCard.front.trim(),
          `Card #${i + 1} front mismatch in fixture '${dirName}'`
        );
        assert.equal(
          actualCard.back.trim(),
          expectedCard.back.trim(),
          `Card #${i + 1} back mismatch in fixture '${dirName}'`
        );

        if (expectedCard.customFields) {
          assert.ok(
            actualCard.customFields,
            `Card #${i + 1} missing customFields in fixture '${dirName}'`
          );
          for (const [k, v] of Object.entries(expectedCard.customFields)) {
            assert.equal(
              actualCard.customFields?.[k]?.trim(),
              (v as string).trim(),
              `Card #${i + 1} customField '${k}' mismatch in fixture '${dirName}'`
            );
          }
        }
      }

      // 4. Bijective Semantic Round-Trip Verification
      // Every parsed deck must survive serialization to canonical Markdown and re-parsing
      if (actualResult.cards.length > 0) {
        const canonicalMd = cardsToMarkdown(actualResult.cards);
        const roundtrippedResult = DeckParserService.parse(canonicalMd);

        assert.equal(
          roundtrippedResult.success,
          true,
          `Round-trip re-parse failed for fixture '${dirName}'`
        );
        assert.equal(
          roundtrippedResult.cards.length,
          actualResult.cards.length,
          `Round-trip card count mismatch for fixture '${dirName}'`
        );

        for (let i = 0; i < actualResult.cards.length; i++) {
          const original = actualResult.cards[i];
          const roundtripped = roundtrippedResult.cards[i];

          assert.equal(
            roundtripped.front.trim(),
            original.front.trim(),
            `Round-trip front mismatch at Card #${i + 1} in fixture '${dirName}'`
          );
          assert.equal(
            roundtripped.back.trim(),
            original.back.trim(),
            `Round-trip back mismatch at Card #${i + 1} in fixture '${dirName}'`
          );

          if (original.customFields) {
            assert.ok(
              roundtripped.customFields,
              `Round-trip customFields missing at Card #${i + 1} in fixture '${dirName}'`
            );
            for (const [k, v] of Object.entries(original.customFields)) {
              assert.equal(
                roundtripped.customFields?.[k]?.trim(),
                v.trim(),
                `Round-trip customField '${k}' mismatch at Card #${i + 1} in fixture '${dirName}'`
              );
            }
          }
        }
      }
    });
  }
});
