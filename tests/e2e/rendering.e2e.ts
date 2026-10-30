import { routes } from '../../src/lib/spa/router/routes';

import { expect, test, waitForApp } from './fixtures';
import { mockPackages, mockUser } from './mocks';

// Every render is parsed the way the browser parses HTML (#64): entities are
// decoded, and an end tag split over two lines still closes its element

const PAGES = [
  ...routes
    .filter((route) => route.public && !route.path.includes(':'))
    .map((route) => route.path),
  '/packages/@phun-ky/speccer',
  '/users/phun-ky',
  '/users/phun-ky/packages',
  '/this-does-not-exist'
];

test.beforeEach(async ({ page }) => {
  await mockPackages(page, { '@phun-ky/speccer': {} });
  await mockUser(page, 'phun-ky', ['@phun-ky/speccer']);
});

for (const path of PAGES) {
  test(`${path} shows no HTML entities as text`, async ({ page }) => {
    await page.goto(path);
    await waitForApp(page);

    const text = await page.locator('body').innerText();

    expect(text.match(/&(#\d+|#x[\da-f]+|quot|amp|lt|gt|apos);/gi)).toBeNull();
  });
}

test('the FAQ shows quotes and apostrophes as typed', async ({ page }) => {
  await page.goto('/help/faq');
  await waitForApp(page);

  await expect(
    page.getByText(
      'Why are only the packages someone maintains shown, and not the ones they "authored"?'
    )
  ).toBeVisible();
});

test('the package page has no cards inside cards', async ({ page }) => {
  await page.goto('/packages/@phun-ky/speccer');
  await waitForApp(page);

  await expect(page.locator('.emphasized-card .emphasized-card')).toHaveCount(
    0
  );
  await expect(page.locator('.card .card')).toHaveCount(0);
});
