import { lastYearDownloads, packument } from './data/npm';
import {
  expect,
  mockJson,
  mockSupabaseFunction,
  mockSupabaseTable,
  test,
  waitForApp
} from './fixtures';

// Runs without touching the network: the image can't load, so the handler
// runs at once if the markup ends up as HTML
const PAYLOAD = '<img src="data:," onerror="window.__xss = true">';
const scriptRan = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as { __xss?: boolean }).__xss === true);

test.describe('values from the URL', () => {
  for (const path of [
    `/packages/${encodeURIComponent(PAYLOAD)}`,
    `/packages/@scope/${encodeURIComponent(PAYLOAD)}`,
    `/users/${encodeURIComponent(PAYLOAD)}`,
    `/users/${encodeURIComponent(PAYLOAD)}/packages`
  ]) {
    test(`${decodeURIComponent(path)} is not rendered as HTML`, async ({
      page
    }) => {
      await page.goto(path);
      await waitForApp(page);

      await expect(
        page.getByRole('heading', { level: 1, name: 'Page not found' })
      ).toBeVisible();
      expect(await scriptRan(page)).toBe(false);
    });
  }
});

test.describe('searches on the start page', () => {
  const tables = {
    latest_unique_lookups: [
      { kind: 'user', username: PAYLOAD },
      { kind: 'package', package_name: PAYLOAD }
    ],
    trending_lookups_24h: [
      { kind: 'user', term: PAYLOAD },
      { kind: 'package', term: PAYLOAD }
    ],
    popular_lookups_unique_people: [
      { kind: 'user', term: PAYLOAD },
      { kind: 'package', term: PAYLOAD }
    ]
  };

  for (const [table, rows] of Object.entries(tables)) {
    test(`${table} is rendered as text`, async ({ page }) => {
      await mockSupabaseTable(page, table, rows);
      await page.goto('/');
      await waitForApp(page);

      // Every row is shown, with the markup as its text
      await expect(page.getByRole('link', { name: PAYLOAD })).toHaveCount(
        rows.length
      );
      expect(await scriptRan(page)).toBe(false);
    });
  }
});

test.describe('package data from npm', () => {
  test('is rendered as text, with unsafe links left out', async ({ page }) => {
    await mockSupabaseFunction(page, 'npm-package-details', {
      ok: true,
      data: packument('xss-test', {
        description: PAYLOAD,
        keywords: [PAYLOAD],
        license: PAYLOAD,
        deprecated: PAYLOAD,
        homepage: 'javascript:window.__xss=true',
        bugs: { url: `https://example.com/"${PAYLOAD}` },
        maintainers: [{ name: PAYLOAD }]
      })
    });
    await mockSupabaseFunction(page, 'npm-downloads-last-year', {
      ok: true,
      data: lastYearDownloads('xss-test')
    });
    await mockJson(page, 'https://api.osv.dev/v1/query', { vulns: [] });
    await mockJson(page, 'https://api.github.com/repos/**', {
      stargazers_count: 1,
      open_issues_count: 0
    });
    await page.goto('/packages/xss-test');
    await waitForApp(page);

    await expect(page.locator('.description')).toHaveText(PAYLOAD);
    await expect(page.getByRole('link', { name: 'Homepage' })).toHaveCount(0);
    expect(await scriptRan(page)).toBe(false);
  });

  // The renderer decodes few entities, so escaping too much shows up as
  // `&quot;` in text or `&amp;` in links
  test('keeps &, quotes and query strings as written', async ({ page }) => {
    const description = 'Fast & "simple" tools for <div>s, with \'quotes\'';

    await mockSupabaseFunction(page, 'npm-package-details', {
      ok: true,
      data: packument('plain-test', { description })
    });
    await mockSupabaseFunction(page, 'npm-downloads-last-year', {
      ok: true,
      data: lastYearDownloads('plain-test')
    });
    await mockJson(page, 'https://api.osv.dev/v1/query', { vulns: [] });
    await mockJson(page, 'https://api.github.com/repos/**', {
      stargazers_count: 1,
      open_issues_count: 0
    });
    await page.goto('/packages/plain-test');
    await waitForApp(page);

    await expect(page.locator('.description')).toHaveText(description);
    await expect(
      page.getByRole('link', { name: 'Known vulnerabilities on OSV' })
    ).toHaveAttribute(
      'href',
      'https://osv.dev/list?q=plain-test&ecosystem=npm'
    );
  });
});
