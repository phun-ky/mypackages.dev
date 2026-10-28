import { routes } from '../../src/lib/spa/router/routes';

import { expect, test, waitForApp } from './fixtures';
import { mockPackages } from './mocks';

// Served the way GitHub Pages serves the build (see server.mjs), so a page
// the build doesn't write comes from 404.html with status 404 (#39)
const STATIC_PAGES = routes
  .filter((route) => !route.path.includes(':'))
  .map((route) => route.path);

for (const path of STATIC_PAGES) {
  test(`${path} is served with status 200`, async ({ request }) => {
    const res = await request.get(path, { maxRedirects: 0 });

    expect(res.status()).toBe(200);
    expect(await res.text()).toContain('<div id="app">');
  });
}

test('a direct visit to a static page loads it without a redirect', async ({
  page
}) => {
  const res = await page.goto('/help/faq');

  expect(res?.status()).toBe(200);
  expect(res?.request().redirectedFrom()).toBeNull();
  await waitForApp(page);
  await expect(page).toHaveURL('/help/faq');
  await expect(
    page.getByRole('heading', { level: 1, name: /questions/i })
  ).toBeVisible();
});

test('a package page is the app, with status 404 and noindex', async ({
  page
}) => {
  await mockPackages(page, { speccer: {} });

  const res = await page.goto('/packages/speccer');

  // No hop through /?p=
  expect(res?.status()).toBe(404);
  expect(res?.request().redirectedFrom()).toBeNull();
  await waitForApp(page);
  await expect(page).toHaveURL('/packages/speccer');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex'
  );
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'speccer'
  );
});

test('static pages can be indexed', async ({ page }) => {
  await page.goto('/packages');
  await waitForApp(page);

  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});

test('a trailing slash shows the page without it', async ({ page }) => {
  await page.goto('/help/');
  await waitForApp(page);

  await expect(page).toHaveURL('/help');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Page not found' })
  ).toHaveCount(0);
});

test('old ?p= links still open the page', async ({ page }) => {
  await page.goto(`/?p=${encodeURIComponent('/help/faq')}`);
  await waitForApp(page);

  await expect(page).toHaveURL('/help/faq');
  await expect(
    page.getByRole('heading', { level: 1, name: /questions/i })
  ).toBeVisible();
});
