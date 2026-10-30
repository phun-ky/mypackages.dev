// Renders the link preview images into public/images (#108), in the Nebula,
// refined design: a landscape card for og:image (1200x630) and a portrait
// one for tall previews (1080x1350), each at 1x and 2x, as palette PNGs.
//
// Usage: npm run images:og
// Rendering uses Playwright's Chromium, the fonts installed through
// Fontsource and the nebula from public/, so nothing is fetched from the
// network, and Python with Pillow to make the PNGs small. Run it again when
// the design or the copy changes, and commit the PNGs.
import { chromium } from '@playwright/test';

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = join(ROOT, 'public/images');
const FORMATS = [
  { suffix: '-og', width: 1200, height: 630, layout: 'wide' },
  { suffix: '-portrait', width: 1080, height: 1350, layout: 'tall' }
];
const SCALES = [1, 2];
// From the start page's hero
const CONTENT = {
  site: 'mypackages.dev',
  kicker: 'For people who publish to npm',
  title: ['See how your npm packages are ', { accent: 'really doing' }],
  body: 'Downloads, trends, health and security for every package you maintain, on one page. No account needed.'
};
const file = (path) => pathToFileURL(join(ROOT, path)).href;
const escape = (text) =>
  String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
const mark = readFileSync(join(ROOT, 'public/logo.svg'), 'utf8').replace(
  '<svg ',
  '<svg class="mark" '
);
const title = CONTENT.title
  .map((part) =>
    typeof part === 'string'
      ? escape(part)
      : `<span class="accent">${escape(part.accent)}</span>`
  )
  .join('');
// Illustrations, not data: a year of monthly downloads and the health ring
// with its signals, as the site draws them, without numbers
const downloads = `<svg class="chart" viewBox="0 0 360 120" preserveAspectRatio="none" aria-hidden="true">
  <defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="rgb(56 189 248 / 0.35)"/><stop offset="1" stop-color="rgb(56 189 248 / 0)"/>
  </linearGradient></defs>
  <path d="M0 96 L33 90 L65 92 L98 80 L131 83 L164 70 L196 74 L229 58 L262 61 L295 44 L327 40 L360 26 L360 120 L0 120 Z" fill="url(#fill)"/>
  <path d="M0 96 L33 90 L65 92 L98 80 L131 83 L164 70 L196 74 L229 58 L262 61 L295 44 L327 40 L360 26" fill="none" stroke="rgb(56 189 248)" stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
</svg>`;
const ring = `<svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
  <defs><linearGradient id="ring" x1="0" x2="1" y1="0" y2="1">
    <stop offset="0" stop-color="rgb(56 189 248)"/><stop offset="1" stop-color="rgb(29 207 158)"/>
  </linearGradient></defs>
  <circle cx="60" cy="60" r="48" fill="none" stroke="rgb(148 163 184 / 0.18)" stroke-width="12"/>
  <circle cx="60" cy="60" r="48" fill="none" stroke="url(#ring)" stroke-width="12" stroke-linecap="round"
    stroke-dasharray="${(2 * Math.PI * 48 * 0.82).toFixed(1)} ${(2 * Math.PI * 48).toFixed(1)}" transform="rotate(-90 60 60)"/>
</svg>`;
const bars = [
  ['Security', 0.92],
  ['Maintenance', 0.78],
  ['Quality', 0.86],
  ['Popularity', 0.6]
]
  .map(
    ([name, share]) =>
      `<div class="bar"><span>${name}</span><i><b style="width:${share * 100}%"></b></i></div>`
  )
  .join('');
const page = (layout) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
@font-face { font-family: Inter; font-weight: 100 900; src: url(${file('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')}); }
@font-face { font-family: Lexend; font-weight: 100 900; src: url(${file('node_modules/@fontsource-variable/lexend-deca/files/lexend-deca-latin-wght-normal.woff2')}); }
:root { --canvas: rgb(6 10 22); --surface: rgb(15 23 42 / 0.82); --line: rgb(148 163 184 / 0.22);
  --text: rgb(151 166 189); --bright: rgb(232 238 248); --brand: rgb(56 189 248); --brand-2: rgb(29 207 158); }
* { box-sizing: border-box; margin: 0; }
html, body { width: 100%; height: 100%; }
body { position: relative; overflow: hidden; color: var(--text); font-family: Inter, sans-serif;
  background:
    linear-gradient(to bottom, rgb(6 10 22 / 0.25), var(--canvas) 96%),
    radial-gradient(60rem 30rem at 30% 0%, rgb(56 189 248 / 0.14), transparent 70%),
    url(${file('public/nebula_2560x1400.webp')}) center top / cover no-repeat,
    var(--canvas); }
.brand { position: absolute; display: inline-flex; align-items: center; gap: 14px;
  font: 600 26px Lexend, sans-serif; color: var(--bright); }
.brand .mark { width: 40px; height: 40px; }
.kicker { position: absolute; font: 500 18px Lexend, sans-serif; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--brand); }
h1 { position: absolute; font-family: Lexend, sans-serif; font-weight: 600; line-height: 1.08;
  letter-spacing: -0.025em; color: var(--bright); }
.accent { background: linear-gradient(100deg, var(--brand), var(--brand-2));
  -webkit-background-clip: text; background-clip: text; color: transparent; }
p { position: absolute; line-height: 1.5; }
.panel { position: absolute; padding: 22px 24px; border: 1px solid var(--line); border-radius: 18px;
  background: var(--surface); box-shadow: 0 30px 60px rgb(0 0 0 / 0.45); }
.panel h2 { font: 500 15px Lexend, sans-serif; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--text); margin-bottom: 16px; }
.chart { display: block; width: 100%; height: 120px; }
.health { display: flex; align-items: center; gap: 22px; }
.ring { width: 112px; height: 112px; flex: none; }
.bars { flex: 1; display: grid; gap: 12px; }
.bar { display: grid; grid-template-columns: 112px 1fr; align-items: center; gap: 12px; font-size: 15px; }
.bar i { height: 8px; border-radius: 99px; background: rgb(148 163 184 / 0.18); overflow: hidden; }
.bar b { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--brand), var(--brand-2)); }
/* wide: text left, panels right */
.wide .brand { top: 56px; left: 64px; }
.wide .kicker { top: 168px; left: 64px; }
.wide h1 { top: 204px; left: 64px; width: 600px; font-size: 58px; }
.wide p { top: 418px; left: 64px; width: 600px; font-size: 21px; }
.wide .panel { right: 64px; width: 420px; }
.wide .panel-0 { top: 64px; }
.wide .panel-1 { top: 318px; }
/* tall: text on top, panels below */
.tall .brand { top: 80px; left: 80px; font-size: 32px; }
.tall .brand .mark { width: 50px; height: 50px; }
.tall .kicker { top: 220px; left: 80px; font-size: 22px; }
.tall h1 { top: 266px; left: 80px; width: 920px; font-size: 92px; }
.tall p { top: 586px; left: 80px; width: 900px; font-size: 30px; }
.tall .panel { left: 80px; width: 920px; padding: 30px 34px; }
.tall .panel h2 { font-size: 19px; margin-bottom: 22px; }
.tall .panel-0 { top: 736px; }
.tall .chart { height: 170px; }
.tall .panel-1 { top: 1030px; }
.tall .ring { width: 150px; height: 150px; }
.tall .bars { gap: 16px; }
.tall .bar { grid-template-columns: 170px 1fr; font-size: 20px; }
.tall .bar i { height: 10px; }
</style></head>
<body><main class="${layout}">
  <div class="brand">${mark}${escape(CONTENT.site)}</div>
  <div class="kicker">${escape(CONTENT.kicker)}</div>
  <h1>${title}</h1>
  <p>${escape(CONTENT.body)}</p>
  <section class="panel panel-0"><h2>Downloads per month</h2>${downloads}</section>
  <section class="panel panel-1"><h2>Package health</h2><div class="health">${ring}<div class="bars">${bars}</div></div></section>
</main></body></html>`;
const browser = await chromium.launch();
// Pages from files, so they may load the fonts and the nebula from disk
const dir = mkdtempSync(join(tmpdir(), 'og-'));
const written = [];

try {
  for (const { suffix, width, height, layout } of FORMATS) {
    const html = join(dir, `${layout}.html`);

    writeFileSync(html, page(layout));

    for (const scale of SCALES) {
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: scale
      });
      const tab = await context.newPage();
      const path = join(
        OUT,
        `mypackages${suffix}${scale === 2 ? '@2x' : ''}.png`
      );

      await tab.goto(pathToFileURL(html).href, { waitUntil: 'load' });
      await tab.evaluate(() => document.fonts.ready);
      await tab.screenshot({ path });
      await context.close();
      written.push(path);
    }
  }
} finally {
  await browser.close();
  rmSync(dir, { recursive: true, force: true });
}

// A palette of up to 256 colours keeps the artwork sharp and small
execFileSync(
  'python3',
  [
    '-c',
    `import sys
from PIL import Image
for path in sys.argv[1:]:
    Image.open(path).convert('RGB').quantize(256, method=Image.Quantize.MEDIANCUT).save(path, optimize=True)`,
    ...written
  ],
  { stdio: 'inherit' }
);

for (const path of written) console.log(path.slice(ROOT.length));
