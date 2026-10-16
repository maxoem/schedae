import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputFile = path.resolve(rootDir, 'src/data/changelog.json');

export interface ChangelogRelease {
  id: number;
  tag: string;
  name: string;
  publishedAt: string;
  body: string;
  url: string;
  isPrerelease: boolean;
}

const DEFAULT_FALLBACK: ChangelogRelease[] = [
  {
    id: 1,
    tag: "v1.0.0",
    name: "v1.0.0 - Initial Release",
    publishedAt: "2026-03-01T00:00:00.000Z",
    body: "### Welcome to Schedae!\n\nInitial public release of Schedae, a privacy-first web application for creating, managing, and converting Anki flashcard decks.\n\n#### Highlights\n* **Markdown to APKG Converter**: Transform structured markdown notes into ready-to-import Anki `.apkg` packages with full KaTeX math support.\n* **APKG to Markdown**: Extract existing Anki packages back into human-readable, editable Markdown files.\n* **LLM Merge & Remaster**: Tools for merging and upgrading flashcard sets with LLMs.\n* **100% Client-Side**: All parsing, SQLite/Wasm operations, and deck generation run locally in your browser. No data ever leaves your device.",
    url: "https://github.com/maxoem/Schedae/releases",
    isPrerelease: false
  }
];

async function fetchReleases(): Promise<void> {
  const repo = process.env.GITHUB_REPOSITORY || 'maxoem/Schedae';
  const token = process.env.GITHUB_TOKEN;
  const apiUrl = `https://api.github.com/repos/${repo}/releases?per_page=50`;

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Schedae-Changelog-Builder',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log(`📡 Fetching releases from ${apiUrl}...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(apiUrl, {
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const releases: ChangelogRelease[] = data
          .filter((r: any) => !r.draft)
          .map((r: any) => ({
            id: r.id,
            tag: r.tag_name || '',
            name: r.name || r.tag_name || 'Release',
            publishedAt: r.published_at || r.created_at || new Date().toISOString(),
            body: r.body || '*No release description provided.*',
            url: r.html_url || `https://github.com/${repo}/releases`,
            isPrerelease: Boolean(r.prerelease),
          }));

        if (releases.length > 0) {
          fs.mkdirSync(path.dirname(outputFile), { recursive: true });
          fs.writeFileSync(outputFile, JSON.stringify(releases, null, 2), 'utf-8');
          console.log(`✅ Successfully synced ${releases.length} releases into ${outputFile}`);
          return;
        }
      } else {
        console.log(`ℹ️ GitHub returned empty releases list for ${repo}.`);
      }
    } else {
      console.warn(`⚠️ GitHub API returned HTTP ${res.status}: ${res.statusText}`);
    }
  } catch (err: any) {
    console.warn(`⚠️ Could not reach GitHub API (${err?.message || err}).`);
  }

  // Graceful fallback: Keep existing file if valid, otherwise create fallback
  if (fs.existsSync(outputFile)) {
    try {
      const existing = fs.readFileSync(outputFile, 'utf-8');
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`ℹ️ Preserving existing changelog data (${parsed.length} entries).`);
        return;
      }
    } catch {
      // ignore JSON parse error
    }
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(DEFAULT_FALLBACK, null, 2), 'utf-8');
  console.log(`ℹ️ Generated fallback changelog at ${outputFile}.`);
}

fetchReleases().catch((err) => {
  console.error('Unexpected error in fetch-changelog script:', err);
  // Do not fail the build
  process.exit(0);
});
