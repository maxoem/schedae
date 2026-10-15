# Schedae — Anki Flashcard Studio

> A client-side web application for authoring, restructuring, converting, and previewing flashcard decks with Markdown, LaTeX (KaTeX), and native Anki (`.apkg`) support.



Schedae operates entirely within the browser. File parsing, WebAssembly-based database operations, and deck exports execute locally on the client device without transmitting flashcard data to external servers.

---

## Key Capabilities

### Anki (.apkg) & Tabular Data Engine
* **In-Browser SQLite via WebAssembly:** Directly queries and constructs native Anki SQLite databases (`collection.anki2` and related schema) in-memory using `sql.js`.
* **Zstandard Decompression:** Decompresses modern Anki 2.1.50+ `.anki21b` collections client-side using `fzstd`.
* **Format Interoperability:** Converts bidirectionally between delimited text (TSV), structured JSON, Markdown representations, and import-ready `.apkg` archives with packaged media and stylesheets.

### Mathematical Typesetting (LaTeX / KaTeX)
* **Dual Delimiter Support:** Parses and renders inline and display math via both standard LaTeX notation (`\( ... \)`, `\[ ... \]`) and delimiter pairs (`$ ... $`, `$$ ... $$`).
* **Anki MathJax Compatibility:** Normalizes escaped backslashes, HTML math spans, and Anki MathJax markers (`[$]...[/$]`, `[$$]...[/$$]`) during import and export cycles.

### Parsing Pipeline & Format Heuristics
* **Format Classification:** Heuristically identifies input schemas (e.g., heading-based Q&A hierarchies, bulleted key-value lists, raw JSON structures, or fenced code blocks).
* **Strategy-Based Architecture:** Uses an extensible strategy pattern (`DeckParserService`) to separate format-specific token extraction from intermediate card representation.
* **Visual Field Highlighting:** Provides real-time visual feedback distinguishing question, answer, and supplementary metadata fields (e.g., *Notes*, *Sources*).

### Structural AST Stencil Extraction
* **Deterministic Pattern Transfer:** To minimize token usage and latency compared to full-document LLM ingestion, an initial sample card is parsed into a Markdown Abstract Syntax Tree (mdast). An LLM identifies front/back field nodes once, generating a structural path template (stencil) that is deterministically applied to cards $2 \dots N$.
* **Local Inference Compatibility:** Connects directly to local Ollama endpoints (`http://localhost:11434`) or any standard OpenAI-compatible REST API.

### Deck Restructuring & Normalization
* **Legacy HTML Sanitization:** Converts legacy HTML and `<br>`-delimited notes into clean Markdown using AST transforms and Turndown.
* **Typographical & Layout Normalization:** Corrects irregular single-space bullet indentations and strips redundant localized label prefixes (e.g., *Front:*, *Back:*, *Vorderseite:*, *Rückseite:*).

---

## Technical Scope & Considerations

* **Client Memory Bounds:** Because SQLite databases and `.apkg` ZIP archives are built and processed in-memory (via WebAssembly and browser JS heaps), performance is constrained by available client RAM. The application is well-suited for typical decks (thousands of cards), but collections with multi-gigabyte embedded video or audio files may encounter browser memory limits.
* **LaTeX Compatibility:** Mathematical notation is rendered using [KaTeX](https://katex.org/). While KaTeX supports extensive mathematical syntax, arbitrary LaTeX packages (e.g., `tikz`, complex chemistry packages) are not supported in-browser and require native desktop Anki MathJax rendering.
* **Structural Consistency in Heuristics:** Stencil and heuristic extractors assume uniform layout patterns throughout a single import source. Irregular or freely formatted notes may require manual adjustment.

---

## Architecture & Tech Stack

| Subsystem | Technology | Purpose |
| :--- | :--- | :--- |
| **Application Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/) | Client-side reactive interface and build tooling |
| **UI Components** | [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) | Accessible primitives and responsive styling |
| **AST & Text Processing** | [unified](https://unifiedjs.com/), [remark](https://github.com/remarkjs/remark), [marked](https://marked.js.org/), [Turndown](https://github.com/mixmark-io/turndown) | Markdown AST traversal, transformation, and normalization |
| **Binary & Database** | [sql.js](https://sql.js.org/) (SQLite WASM), [fzstd](https://github.com/101arrowz/fzstd), [JSZip](https://stuk.github.io/jszip/) | Client-side database execution and archive compression |
| **Sanitization & Security** | [DOMPurify](https://github.com/cure53/DOMPurify), hardened CSP | Client-side XSS mitigation for rendered HTML |

---

## Getting Started

### Prerequisites
* **Node.js**: Version 22 LTS or newer (tested on Node 22 and 24)
* **Package Manager**: `pnpm` (recommended) or `npm`

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/maxoem/Schedae.git
cd Schedae

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The development server will be available at `http://localhost:5173`.

### Testing & Verification

Automated tests run via Node's native test runner with `tsx`:

```bash
# Execute test suite
pnpm test

# Typecheck and build bundle
pnpm run build
```

---

## Container Deployment

A production Docker configuration is provided based on `nginx-unprivileged:stable-alpine` (running as non-root UID 101).

### 1. Build Container Image

```bash
docker build -t schedae:latest .
```

### 2. Run with Hardened Security Constraints

```bash
docker run -d \
  --name schedae \
  --restart unless-stopped \
  --security-opt=no-new-privileges:true \
  --cap-drop=ALL \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --memory="256m" \
  --cpus="0.5" \
  -p 8080:8080 \
  -e SITE_URL="https://your-domain.example" \
  schedae:latest
```

* **Healthcheck Endpoint:** `http://localhost:8080/healthz` validates server liveness.
* **Privilege Separation:** Nginx worker runs as unprivileged UID `101`.
* **Runtime SEO Configuration:** Dynamically substitutes `SITE_URL` in `sitemap.xml` and `robots.txt` at container initialization within `/tmp`.

---

## Security & Privacy Model

* **Local Processing:** All card data, database queries, and media manipulations occur exclusively within the client's browser environment. No card contents or analytical telemetry are dispatched to external servers.
* **Input Sanitization:** User-supplied Markdown and rendered HTML undergo strict DOM sanitization via `DOMPurify` prior to insertion into the DOM tree.
* **Direct Local Inference:** When using LLM-assisted stencil generation, network requests are dispatched directly from the browser to the designated endpoint (e.g., local Ollama at `http://localhost:11434`), without intermediary relays.

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.  
Third-party software and font licenses are documented in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
