import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as viteBuild } from "vite";
import type { Deck } from "../src/data/decks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const buildDir = path.resolve(rootDir, "build");
const ssrOutDir = path.resolve(rootDir, ".ssr-tmp");

function loadPublicDecksForSsr(): Deck[] {
  const manifestPath = path.resolve(rootDir, "public/data/decks/index.json");
  if (!fs.existsSync(manifestPath)) return [];

  try {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : parsed?.decks || [];
    return items.map((item: any) => {
      const id = String(item.id || "").trim();
      const title = String(item.title || id).trim();
      return {
        id,
        slug: item.slug ? String(item.slug).trim() : undefined,
        stackId: item.stackId ? String(item.stackId).trim() : undefined,
        title,
        description: String(item.description || "").trim(),
        topic: String(item.topic || "Allgemein").trim(),
        author: String(item.author || "Unbekannt").trim(),
        date: String(item.date || new Date().toISOString().slice(0, 10)).trim(),
        complexity:
          item.complexity === "Fortgeschritten" || item.complexity === "Profi"
            ? item.complexity
            : "Anfänger",
        level: String(item.level || "BSc").trim(),
        creationTag: item.creationTag,
        cardCount: typeof item.cardCount === "number" ? item.cardCount : item.insights?.cardCount,
        insights: item.insights,
        subsets: Array.isArray(item.subsets) ? item.subsets : undefined,
        cardsUrl: item.cardsUrl || (item.file ? `/data/decks/${item.file}` : undefined),
      } satisfies Deck;
    });
  } catch (err) {
    console.warn("⚠️ Could not load public decks for pre-rendering:", err);
    return [];
  }
}

function getRoutesFromSitemap(): string[] {
  const sitemapPath = path.resolve(buildDir, "sitemap.xml");
  if (!fs.existsSync(sitemapPath)) {
    return ["/"];
  }
  const xml = fs.readFileSync(sitemapPath, "utf-8");
  const matches = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g));
  const routes = matches
    .map((m) => {
      try {
        return new URL(m[1]).pathname || "/";
      } catch {
        return "/";
      }
    })
    .filter(Boolean);

  return Array.from(new Set(["/", ...routes]));
}

function extractHeadTags(renderedHtml: string): { headTags: string; bodyHtml: string } {
  const headParts: string[] = [];
  let bodyHtml = renderedHtml;

  const patterns = [
    /<title>[\s\S]*?<\/title>/gi,
    /<meta\s+[^>]*?(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*?>/gi,
    /<link\s+[^>]*?rel=["']canonical["'][^>]*?>/gi,
    /<script\s+type=["']application\/ld\+json["'][^>]*?>[\s\S]*?<\/script>/gi,
  ];

  for (const regex of patterns) {
    bodyHtml = bodyHtml.replace(regex, (match) => {
      headParts.push(match);
      return "";
    });
  }

  return { headTags: headParts.join("\n    "), bodyHtml };
}

function isGermanRoute(routePath: string): boolean {
  return (
    routePath === "/decks" ||
    routePath === "/kartenkonzept" ||
    routePath === "/deck/create" ||
    routePath.startsWith("/deck/") ||
    routePath.startsWith("/stack/")
  );
}

async function main() {
  const templatePath = path.resolve(buildDir, "index.html");
  if (!fs.existsSync(templatePath)) {
    throw new Error("build/index.html not found. Run vite build first.");
  }

  const templateHtml = fs.readFileSync(templatePath, "utf-8");

  await viteBuild({
    root: rootDir,
    logLevel: "silent",
    build: {
      ssr: path.resolve(rootDir, "src/entry-server.tsx"),
      outDir: ssrOutDir,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          format: "es",
          entryFileNames: "entry-server.mjs",
        },
      },
    },
  });

  try {
    const entryModule = await import(path.resolve(ssrOutDir, "entry-server.mjs"));
    const render: (url: string, publicDecks: Deck[]) => string = entryModule.render;
    const publicDecks = loadPublicDecksForSsr();
    const routes = getRoutesFromSitemap();

    for (const routePath of routes) {
      const rendered = render(routePath, publicDecks);
      const { headTags, bodyHtml } = extractHeadTags(rendered);

      let html = templateHtml;
      if (isGermanRoute(routePath)) {
        html = html.replace(/<html\s+lang="en"/i, '<html lang="de"');
      }

      // Remove fallback title and description so route-specific tags are authoritative
      html = html
        .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
        .replace(/<meta\s+name="description"[\s\S]*?\/>\s*/i, "")
        .replace("<!-- __ANALYTICS_SCRIPT__ -->", () => `${headTags}\n    <!-- __ANALYTICS_SCRIPT__ -->`)
        .replace('<div id="root"></div>', () => `<div id="root">${bodyHtml}</div>`);

      const outPath =
        routePath === "/"
          ? templatePath
          : path.resolve(buildDir, routePath.replace(/^\/+/, ""), "index.html");

      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html, "utf-8");
    }

    console.log(`✅ Pre-rendered ${routes.length} routes into build/`);
  } finally {
    fs.rmSync(ssrOutDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("❌ Pre-rendering failed:", err);
  process.exit(1);
});
