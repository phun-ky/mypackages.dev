// Check the built site's metadata (#40): every page has a title, a
// description, Open Graph tags and either a canonical URL or noindex; no two
// indexed pages share a title or canonical URL; every sitemap URL is a page
// in dist/, and robots.txt points at the sitemap. Run after `vite build`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const ORIGIN = 'https://mypackages.dev';
const REQUIRED = [
  /<title>[^<]+<\/title>/,
  /<meta name="description" content="[^"]+"/,
  /<meta property="og:title" content="[^"]+"/,
  /<meta property="og:description" content="[^"]+"/,
  /<meta property="og:url" content="https:\/\/mypackages\.dev\/[^"]*"/,
  /<meta property="og:image" content="https:\/\/mypackages\.dev\/[^"]+"/,
  /<meta name="twitter:card" content="[^"]+"/
];
const problems = [];
const pages = readdirSync(DIST, { recursive: true })
  .filter((file) => file.endsWith('.html'))
  .map((file) => join(DIST, file));
// A page can be written twice, as /help.html and /help/index.html
const seen = { title: new Map(), canonical: new Map() };

for (const file of pages) {
  const name = relative(DIST, file);
  const html = readFileSync(file, 'utf8');

  for (const pattern of REQUIRED) {
    if (!pattern.test(html)) problems.push(`${name}: no ${pattern.source}`);
  }

  const count = (pattern) => html.match(new RegExp(pattern, 'g'))?.length ?? 0;

  if (count('<title>') !== 1) problems.push(`${name}: not one <title>`);

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const noindex = /<meta name="robots" content="noindex"/.test(html);

  if (!canonical === !noindex) {
    problems.push(`${name}: needs a canonical URL or noindex, not both`);
  }

  if (!canonical) continue;

  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];

  if (ogUrl !== canonical) {
    problems.push(`${name}: og:url ${ogUrl} isn't the canonical ${canonical}`);
  }

  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];

  for (const [key, value] of [
    ['title', title],
    ['canonical', canonical]
  ]) {
    const other = seen[key].get(value);

    if (other && seen.canonical.get(canonical) !== other) {
      problems.push(`${name}: same ${key} as ${other}: ${value}`);
    }

    seen[key].set(value, seen[key].get(value) ?? name);
  }
}

const sitemapFile = join(DIST, 'sitemap.xml');

if (!existsSync(sitemapFile)) {
  problems.push('sitemap.xml is missing');
} else {
  const urls = [
    ...readFileSync(sitemapFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)
  ].map((m) => m[1]);

  if (!urls.length) problems.push('sitemap.xml has no URLs');

  for (const url of urls) {
    const path = url.slice(ORIGIN.length);
    const file =
      path === '/' ? join(DIST, 'index.html') : join(DIST, `${path}.html`);

    if (!url.startsWith(`${ORIGIN}/`) || !existsSync(file)) {
      problems.push(`sitemap.xml: ${url} isn't a page in dist/`);
    } else if (
      !readFileSync(file, 'utf8').includes(
        `<link rel="canonical" href="${url}"`
      )
    ) {
      problems.push(`sitemap.xml: ${url} isn't that page's canonical URL`);
    }
  }
}

const robots = join(DIST, 'robots.txt');

if (
  !existsSync(robots) ||
  !readFileSync(robots, 'utf8').includes(`Sitemap: ${ORIGIN}/sitemap.xml`)
) {
  problems.push('robots.txt is missing or doesn’t point at the sitemap');
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

console.log(`Metadata checked in ${pages.length} pages`);
