import { unified } from "unified";
import remarkParse from "remark-parse";
import { extractFlashcardsFromText, PREDEFINED_EXTRACTION_SETS } from "../src/components/flashcard/SplitSettingsDialog";

const md2 = `
**Karte 1: XY**
*Frage:* Was ist 1+1?
*Antwort:* 2

**Karte 2: AB**
*Frage:* Wie heißt die Hauptstadt von Frankreich?
*Antwort:* Paris
`;

console.log(PREDEFINED_EXTRACTION_SETS.find(p => p.id === "bold-italic"));

console.log("MD2", extractFlashcardsFromText(md2, PREDEFINED_EXTRACTION_SETS.find(p => p.id === "bold-italic")!));
