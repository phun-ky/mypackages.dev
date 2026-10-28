import type { Page } from '@playwright/test';

import { expect, test, waitForApp } from './fixtures';
import { mockPackages, mockUser } from './mocks';

// The app's event helpers (addOnClick, addOnKeydown and so on) listen on the
// document and look for the element an event is for (#71)

/** Counts the searches the start page logs. */
const countLoggedSearches = async (page: Page) => {
  const logged: string[] = [];

  await page.route('**/rest/v1/rpc/log_search_event', (route) => {
    logged.push(route.request().postData() ?? '');

    return route.fulfill({ status: 204 });
  });

  return logged;
};

test('a click on the GitHub icon starts sign-in', async ({ page }) => {
  await page.route('**/auth/v1/authorize?*', (route) => route.abort());
  await page.goto('/dashboard/signin');
  await waitForApp(page);

  const [authorize] = await Promise.all([
    page.waitForRequest('**/auth/v1/authorize?*'),
    page
      .getByRole('button', { name: 'Continue with GitHub' })
      .locator('svg')
      .first()
      .dispatchEvent('click')
  ]);

  expect(new URL(authorize.url()).searchParams.get('provider')).toBe('github');
});

test('a click on the theme toggle icon switches the theme', async ({
  page
}) => {
  await page.goto('/');
  await waitForApp(page);

  const isLight = () =>
    page.evaluate(() =>
      document.documentElement.classList.contains('theme--light')
    );
  const light = await isLight();

  await page.locator('#theme-toggle svg').first().dispatchEvent('click');

  await expect.poll(isLight).toBe(!light);
});

test('a click on the count in a filter chip filters', async ({ page }) => {
  await mockPackages(page, { speccer: {}, '@phun-ky/speccer': {} });
  await mockUser(page, 'phun-ky', ['speccer', '@phun-ky/speccer']);
  await page.goto('/users/phun-ky');
  await waitForApp(page);
  // The chips are in the table view
  await page.getByRole('button', { name: 'Table' }).click();

  const chip = page.locator('.filter-chip').nth(1);

  // Dispatched on the count itself, whatever CSS does with pointer events
  await chip.locator('.n').dispatchEvent('click');

  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.filter-chip').first()).toHaveAttribute(
    'aria-pressed',
    'false'
  );
});

test('Enter in the search runs on keydown', async ({ page }) => {
  await mockPackages(page, { speccer: {} });
  await countLoggedSearches(page);
  await page.goto('/');
  await waitForApp(page);

  await page.locator('#query-term-to-use').fill('speccer');
  // Only the key going down, no keyup
  await page.keyboard.down('Enter');

  await expect(page).toHaveURL('/packages/speccer');
});

test('handlers from earlier visits to a page are gone', async ({ page }) => {
  await mockPackages(page, { speccer: {} });

  const logged = await countLoggedSearches(page);

  await page.goto('/');
  await waitForApp(page);

  // Away and back three times, in the app, so the start page renders again
  for (let i = 0; i < 3; i++) {
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Packages' })
      .click();
    await expect(page).toHaveURL('/packages');
    await page.getByRole('link', { name: 'My packages' }).first().click();
    await expect(page).toHaveURL('/');
    await waitForApp(page);
  }

  await page.locator('#query-term-to-use').fill('speccer');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/packages/speccer');
  // Let any extra handler finish
  await page.waitForLoadState('networkidle');

  expect(logged).toHaveLength(1);
});
