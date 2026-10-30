// Renders the icons and README banners from the marks in public/logo (#49):
// the favicon PNGs and .ico, the Apple touch icon and the web app manifest
// icons in public/meta, and a README banner for light and dark in
// public/logo.
//
// Usage: npm run images:logo
// Rendering uses Playwright's Chromium and the Fontsource fonts, so nothing
// is fetched from the network, and Python with Pillow for the .ico and to
// make the PNGs small. Run it again when a mark changes, and commit the
// files.
import { chromium } from '@playwright/test';

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const read = (path) => readFileSync(join(ROOT, path), 'utf8');
const file = (path) => pathToFileURL(join(ROOT, path)).href;
const markPath = read('public/logo/mark-dark.svg').match(/\sd="([^"]+)"/)[1];
// The mark on a full square, for icons the platform cuts its own shape from:
// Apple's touch icon and Android's maskable icons, whose safe zone is the
// middle 80% circle, so the mark takes 60%
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 960">
  <defs><linearGradient id="a" x1="1" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#1dcf9e"/>
  </linearGradient></defs>
  <rect width="960" height="960" fill="#080b16"/>
  <g transform="translate(192 768) scale(.6)"><path fill="url(#a)" d="${markPath}"/></g>
</svg>`;
const ICONS = [
  { svg: read('public/meta/favicon.svg'), size: 16, out: 'favicon-16.png' },
  { svg: read('public/meta/favicon.svg'), size: 32, out: 'favicon-32.png' },
  { svg: read('public/meta/favicon.svg'), size: 48, out: 'favicon-48.png' },
  {
    svg: read('public/meta/favicon.svg'),
    size: 96,
    out: 'public/meta/favicon-96x96.png'
  },
  { svg: square, size: 180, out: 'public/meta/apple-touch-icon.png' },
  { svg: square, size: 192, out: 'public/meta/web-app-manifest-192x192.png' },
  { svg: square, size: 512, out: 'public/meta/web-app-manifest-512x512.png' }
];
// README banners, at twice the width GitHub shows them
const BANNER = { width: 830, height: 240, scale: 2 };
const banner = (theme) => {
  const dark = theme === 'dark';

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
@font-face { font-family: Inter; font-weight: 100 900; src: url(${file('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')}); }
@font-face { font-family: Lexend; font-weight: 100 900; src: url(${file('node_modules/@fontsource-variable/lexend-deca/files/lexend-deca-latin-wght-normal.woff2')}); }
* { box-sizing: border-box; margin: 0; }
html, body { width: 100%; height: 100%; }
body { display: flex; align-items: center; gap: 36px; padding: 0 56px; overflow: hidden;
  border-radius: 18px; font-family: Inter, sans-serif;
  color: ${dark ? 'rgb(151 166 189)' : 'rgb(81 96 122)'};
  background: ${
    dark
      ? `linear-gradient(to right, rgb(6 10 22 / 0.2), rgb(6 10 22 / 0.85)), url(${file('public/nebula_2560x1400.webp')}) center / cover, rgb(6 10 22)`
      : 'radial-gradient(40rem 16rem at 15% 0%, rgb(2 132 199 / 0.16), transparent 70%), radial-gradient(30rem 14rem at 90% 100%, rgb(4 120 87 / 0.12), transparent 70%), rgb(243 247 251)'
  }; }
.mark { width: 112px; height: 112px; flex: none; }
h1 { font: 600 44px/1.1 Lexend, sans-serif; letter-spacing: -0.02em;
  color: ${dark ? 'rgb(232 238 248)' : 'rgb(11 19 36)'}; }
p { margin-top: 10px; font-size: 21px; line-height: 1.4; }
</style></head>
<body>
  ${read(dark ? 'public/logo/mark-dark.svg' : 'public/logo/mark.svg').replace('<svg ', '<svg class="mark" ')}
  <div><h1>My packages</h1><p>See how your npm packages are really doing: downloads, releases and health, from npm’s own data.</p></div>
</body></html>`;
};
const browser = await chromium.launch();
const dir = mkdtempSync(join(tmpdir(), 'logo-'));
const written = [];
const shoot = async (html, width, height, scale, out) => {
  const page = join(dir, `${written.length}.html`);
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale
  });
  const tab = await context.newPage();

  writeFileSync(page, html);
  await tab.goto(pathToFileURL(page).href, { waitUntil: 'load' });
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({ path: join(ROOT, out), omitBackground: true });
  await context.close();
  written.push(out);
};

try {
  for (const { svg, size, out } of ICONS) {
    await shoot(
      `<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
      size,
      size,
      1,
      out.includes('/') ? out : join('scripts/logo', out)
    );
  }

  for (const theme of ['light', 'dark']) {
    await shoot(
      banner(theme),
      BANNER.width,
      BANNER.height,
      BANNER.scale,
      `public/logo/banner-${theme}.png`
    );
  }
} finally {
  await browser.close();
}

// favicon.ico with the 16, 32 and 48 pixel icons, then palette PNGs. The
// small icons keep full colour: a palette bands their gradient.
const small = ['16', '32', '48'].map((n) =>
  join(ROOT, `scripts/logo/favicon-${n}.png`)
);

try {
  execFileSync(
    'python3',
    [
      '-c',
      `import sys
from PIL import Image
ico, *pngs = sys.argv[1:]
images = [Image.open(p).convert('RGBA') for p in pngs]
images[-1].save(ico, sizes=[(i.width, i.height) for i in images], append_images=images[:-1])`,
      join(ROOT, 'public/meta/favicon.ico'),
      ...small
    ],
    { stdio: 'inherit' }
  );
  execFileSync(
    'python3',
    [
      '-c',
      `import sys
from PIL import Image
for path in sys.argv[1:]:
    Image.open(path).quantize(256, method=Image.Quantize.FASTOCTREE).save(path, optimize=True)`,
      ...written
        .filter((out) => !out.startsWith('scripts/'))
        .map((out) => join(ROOT, out))
    ],
    { stdio: 'inherit' }
  );
} finally {
  for (const path of small) rmSync(path, { force: true });
  rmSync(dir, { recursive: true, force: true });
}

for (const out of written.filter((o) => !o.startsWith('scripts/'))) {
  console.log(out);
}

console.log('public/meta/favicon.ico');
