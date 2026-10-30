import { FileSystemConfigLoader, HtmlValidate } from 'html-validate';

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

import { routes } from '../../src/lib/spa/router/routes';

import { expect, test, waitForApp } from './fixtures';
import { mockPackages, mockUser } from './mocks';

// Links, anchors and assets in the built site, and valid markup on every
// rendered page (#42). External links are checked weekly by
// .github/workflows/links.yml, not here.

// Pages with data: the public routes, and the mocked package and user
const PAGES = [
  ...routes
    .filter((route) => route.public && !route.path.includes(':'))
    .map((route) => route.path),
  '/packages/speccer',
  '/packages/@phun-ky/speccer',
  '/users/phun-ky',
  '/users/phun-ky/packages',
  '/this-does-not-exist'
];
// A rendered page serializes differently from the source: an uppercase
// doctype, `crossorigin=""` and the templates' whitespace. Style attributes
// are allowed by the CSP on purpose (bar widths, charts).
const validator = new HtmlValidate(new FileSystemConfigLoader());
const RENDERED_RULES = {
  'doctype-style': 'off',
  'attribute-empty-style': 'off',
  'no-trailing-whitespace': 'off',
  'no-inline-style': 'off'
} as const;

test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'The markup and links are the same in every browser'
);

test.beforeEach(async ({ page }) => {
  await mockPackages(page, { speccer: {}, '@phun-ky/speccer': {} });
  await mockUser(page, 'phun-ky', ['speccer', '@phun-ky/speccer']);
});

for (const path of PAGES) {
  test(`${path} is valid HTML`, async ({ page }) => {
    await page.goto(path);
    await waitForApp(page);

    const report = await validator.validateString(
      await page.content(),
      join(cwd(), 'rendered.html'),
      { rules: RENDERED_RULES }
    );

    expect(
      report.results.flatMap((result) =>
        result.messages.map(
          (m) => `${m.ruleId}: ${m.message} (${m.selector ?? m.line})`
        )
      )
    ).toEqual([]);
  });

  test(`${path} links only to pages, anchors and files that exist`, async ({
    page,
    request,
    baseURL
  }) => {
    await page.goto(path);
    await waitForApp(page);

    const origin = new URL(baseURL!).origin;
    const { links, assets, ids } = await page.evaluate(() => ({
      links: [...document.querySelectorAll<HTMLAnchorElement>('a[href]')].map(
        (a) => a.href
      ),
      assets: [
        ...document.querySelectorAll<HTMLElement>(
          'img[src], script[src], link[href]:not([rel="canonical"])'
        )
      ].map(
        (el) =>
          (el as HTMLImageElement).src || (el as HTMLLinkElement).href || ''
      ),
      ids: [...document.querySelectorAll('[id]')].map((el) => el.id)
    }));
    const broken: string[] = [];

    for (const href of new Set(links)) {
      const url = new URL(href);

      if (url.origin !== origin) continue;

      // A link to this page is there; an anchor on it must be too
      if (url.pathname === new URL(page.url()).pathname) {
        const id = decodeURIComponent(url.hash.slice(1));

        if (id && !id.startsWith('options=') && !ids.includes(id))
          broken.push(`${href}: no element with id "${id}"`);

        continue;
      }

      // Every path is a route of the app, not the page not found page
      const pathname = decodeURI(url.pathname).replace(/(.)\/$/, '$1');
      const route = routes.find((r) => r.regex?.test(pathname));

      if (!route) broken.push(`${href}: no page at this path`);
    }

    for (const src of new Set(assets)) {
      if (!src.startsWith(origin)) continue;

      const response = await request.get(src);

      if (!response.ok()) broken.push(`${src}: ${response.status()}`);
    }

    expect(broken).toEqual([]);
  });
}

test('every built page is valid HTML', async () => {
  const files = readdirSync('dist', { recursive: true })
    .map(String)
    .filter((file) => file.endsWith('.html'))
    .map((file) => join(cwd(), 'dist', file));
  const report = await validator.validateMultipleFiles(files);

  expect(files.length).toBeGreaterThan(10);
  expect(
    report.results.flatMap((result) =>
      result.messages.map(
        (m) => `${result.filePath}:${m.line} ${m.ruleId}: ${m.message}`
      )
    )
  ).toEqual([]);
});
