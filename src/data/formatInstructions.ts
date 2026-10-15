/**
 * Canonical Format Instructions for LLMs (ChatGPT, Claude, Gemini, Ollama, etc.)
 * Used across Concepts (/kartenkonzept), LLM Guide (/genai-cards), and the Workspace editor.
 */

export const LLM_FORMAT_INSTRUCTIONS = `# Flashcard Formatting Instructions for LLMs

Transform the provided content into high-quality flashcards for Anki.
Strictly adhere to the following formatting protocol so the cards can be imported directly into Schedae.

### Flashcard Template:

### Card
### Question
[State a precise, clear question, conceptual problem, or formal definition query]
### Answer
[Provide a rigorous, didactic explanation or answer. Use standard Markdown formatting]
### Notes
[Optional: Nuance, mnemonics, intuition, edge-cases, or didactic commentary]
### Sources
[Optional: Literature references, chapter/page numbers, or lecture citations]

---

### Strict Formatting Rules:
1. **Card Separator**: Begin each flashcard with \`### Card\` (or separate cards with \`---\`).
2. **Core Q&A Fields**:
   - Mark the front side with \`### Question\` (or \`### Front\`, \`### Frage\`, \`### Vorderseite\`).
   - Mark the back side with \`### Answer\` (or \`### Back\`, \`### Antwort\`, \`### Rückseite\`).
3. **Custom Fields**:
   - Any additional heading level 3 (e.g. \`### Notes\`, \`### Sources\`, \`### Code Example\`, \`### Context\`) is automatically captured as its own dedicated custom field in Anki!
4. **Mathematical Formulas**:
   - Wrap inline math in single dollar signs: \`$E = mc^2$\`.
   - Wrap block/display math in double dollar signs:
     $$f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi) e^{2\\pi i \\xi x} d\\xi$$
5. **No Conversational Filler**:
   - Output ONLY the flashcards. Do not include introductory text ("Here are your flashcards:"), pleasantries, or concluding remarks.
`;

export const LLM_FORMAT_INSTRUCTIONS_SHORT = `Format cards strictly as:
### Card
### Question
[Question / Front]
### Answer
[Answer / Back]
### Notes
[Optional custom field]
### Sources
[Optional custom field]
Rules: Separate cards with ### Card. KaTeX inline $...$ and block $$...$$. No preamble.`;
