import type { Page } from '@playwright/test';

import { expect, mockSupabaseTable, test, waitForApp } from './fixtures';
import { mockPackages, mockUser } from './mocks';

test.beforeEach(async ({ page }) => {
  await mockPackages(page, {
    speccer: { description: 'Annotate your designs' },
    '@phun-ky/speccer': {}
  });
  await mockUser(page, 'phun-ky', ['speccer', '@phun-ky/speccer']);
});

/**
 * Marks the current document, so a test can check that a link was followed
 * by the app, not by loading a new page.
 */
const markDocument = (page: Page) =>
  page.evaluate(() => {
    (window as { __sameDocument?: boolean }).__sameDocument = true;
  });
const isSameDocument = (page: Page) =>
  page.evaluate(
    () => (window as { __sameDocument?: boolean }).__sameDocument === true
  );

test.describe('search on the start page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
  });

  test('opens the page for a package', async ({ page }) => {
    await page
      .getByRole('searchbox', { name: 'Package or npm username' })
      .fill('speccer');
    await page.getByRole('button', { name: 'Show me' }).click();

    await expect(page).toHaveURL('/packages/speccer');
    await expect(
      page.getByRole('heading', { level: 1, name: /speccer/ })
    ).toBeVisible();
  });

  test('opens the page for a scoped package with Enter', async ({ page }) => {
    const search = page.getByRole('searchbox', {
      name: 'Package or npm username'
    });

    await search.fill('@phun-ky/speccer');
    await search.press('Enter');

    await expect(page).toHaveURL('/packages/@phun-ky/speccer');
    await expect(
      page.getByRole('heading', { level: 1, name: /@phun-ky\/speccer/ })
    ).toBeVisible();
  });

  test('opens the page for a user', async ({ page }) => {
    const search = page.getByRole('searchbox', {
      name: 'Package or npm username'
    });

    await search.fill('phun-ky');
    await search.press('Enter');

    await expect(page).toHaveURL('/users/phun-ky');
    await expect(
      page.getByRole('heading', { level: 1, name: 'phun-ky' })
    ).toBeVisible();
  });
});

test('follows a search from the start page statistics', async ({ page }) => {
  await mockSupabaseTable(page, 'latest_unique_lookups', [
    { kind: 'package', package_name: 'speccer' }
  ]);
  await page.goto('/');
  await waitForApp(page);
  await markDocument(page);

  await page
    .locator('#latest-searches')
    .getByRole('link', { name: 'speccer' })
    .click();

  await expect(page).toHaveURL('/packages/speccer');
  await expect(
    page.getByRole('heading', { level: 1, name: /speccer/ })
  ).toBeVisible();
  expect(await isSameDocument(page)).toBe(true);
});

test.describe('package page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/packages/speccer');
    await waitForApp(page);
  });

  test('shows the package from npm', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: /speccer/ })
    ).toContainText('v1.0.0');
    await expect(page.locator('.description')).toHaveText(
      'Annotate your designs'
    );
    await expect(
      page.locator('#keywords').getByRole('link', { name: 'testing' })
    ).toHaveAttribute(
      'href',
      'https://www.npmjs.com/search?q=keywords:testing'
    );
    await expect(
      page.getByRole('link', { name: 'Repository' })
    ).toHaveAttribute('href', 'https://github.com/example/speccer');
    // Initials, not a GitHub avatar, see #37
    await expect(page.getByRole('link', { name: 'example on npm' })).toHaveText(
      'EX'
    );
    await expect(
      page.getByRole('link', { name: 'example on npm' })
    ).toHaveAttribute('href', 'https://www.npmjs.com/~example');
  });

  test('keeps each card on its own', async ({ page }) => {
    // diff-dom parses templates itself, and doesn't see an end tag split
    // over two lines (`</span` and `>`), so the cards after it end up inside
    await expect(page.locator('.emphasized-card .emphasized-card')).toHaveCount(
      0
    );
  });

  test('draws the downloads chart', async ({ page }) => {
    await expect(
      page.locator('#package-page-chart-speccer .highcharts-root')
    ).toBeVisible();
  });
});

test('goes from a user to one of their packages', async ({ page }) => {
  await page.goto('/users/phun-ky');
  await waitForApp(page);
  await markDocument(page);

  await page
    .getByRole('link', { name: /^@phun-ky\/speccer/ })
    .first()
    .click();

  await expect(page).toHaveURL('/packages/@phun-ky/speccer');
  await expect(
    page.getByRole('heading', { level: 1, name: /@phun-ky\/speccer/ })
  ).toBeVisible();
  expect(await isSameDocument(page)).toBe(true);
});
