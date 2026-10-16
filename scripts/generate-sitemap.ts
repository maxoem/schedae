import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mockDecks, mockStacks } from '../src/data/decks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

// Configure base site URL (via environment variable SITE_URL, VITE_SITE_URL or fallback)
const BASE_URL = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const today = new Date().toISOString().split('T')[0];

interface SitemapRoute {
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

// 1. Static application routes
const staticRoutes: SitemapRoute[] = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/decks', priority: '0.9', changefreq: 'daily' },
  { path: '/kartenkonzept', priority: '0.8', changefreq: 'monthly' },
  { path: '/genai-cards', priority: '0.8', changefreq: 'monthly' },
  { path: '/configure', priority: '0.7', changefreq: 'monthly' },
  { path: '/llm-merge', priority: '0.7', changefreq: 'monthly' },
  { path: '/deck/create', priority: '0.6', changefreq: 'monthly' },
  { path: '/changelog', priority: '0.6', changefreq: 'weekly' },
];

// 2. Discover dynamic routes (decks and stacks)
const deckIds = new Set<string>();
const stackIds = new Set<string>();

// From mock data
for (const deck of mockDecks) {
  if (deck.id) deckIds.add(deck.id);
}
for (const stack of mockStacks) {
  if (stack.id) stackIds.add(stack.id);
}

// From public decks manifest if present
const manifestPath = path.resolve(publicDir, 'data/decks/index.json');
if (fs.existsSync(manifestPath)) {
  try {
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw);
    const decks = Array.isArray(manifest) ? manifest : (manifest.decks || []);
    for (const d of decks) {
      if (d.id) deckIds.add(d.id);
      if (d.stackId) stackIds.add(d.stackId);
    }
  } catch (err) {
    console.warn('⚠️ Could not parse public deck manifest:', err);
  }
}

const dynamicRoutes: SitemapRoute[] = [
  ...Array.from(deckIds).map((id) => ({
    path: `/deck/${encodeURIComponent(id)}`,
    priority: '0.8',
    changefreq: 'weekly' as const,
  })),
  ...Array.from(stackIds).map((id) => ({
    path: `/stack/${encodeURIComponent(id)}`,
    priority: '0.8',
    changefreq: 'weekly' as const,
  })),
];

const allRoutes = [...staticRoutes, ...dynamicRoutes];

// 3. Generate sitemap.xml
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

fs.writeFileSync(path.resolve(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8');
console.log(`✅ Generated sitemap.xml with ${allRoutes.length} URLs for ${BASE_URL}`);

// 4. Generate robots.txt allowing regular search indexers but blocking AI/LLM crawlers
const robotsTxt = `# Standard web crawlers & search engines (Google, Bing, etc.)
User-agent: *
Allow: /

# Block AI training bots, LLM crawlers & scrapers
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Diffbot
Disallow: /

User-agent: FacebookBot
Disallow: /

User-agent: Meta-ExternalAgent
Disallow: /

User-agent: cohere-ai
Disallow: /

User-agent: Amazonbot
Disallow: /

User-agent: Omgilibot
Disallow: /

User-agent: YouBot
Disallow: /

# Sitemap reference
Sitemap: ${BASE_URL}/sitemap.xml
`;

fs.writeFileSync(path.resolve(publicDir, 'robots.txt'), robotsTxt, 'utf-8');
console.log('✅ Generated robots.txt (allowing web indexing, disallowing AI/LLM crawlers)');
