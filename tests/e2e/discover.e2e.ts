import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

import { expect, mockSupabaseTable, test, waitForApp } from './fixtures';
import { mockPackages, mockUser } from './mocks';

const HOUR_MS = 60 * 60 * 1000;
const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * HOUR_MS).toISOString();
/**
 * Lookups of one kind, as the views return them. Each mocked package has
 * 3,000 downloads in the last complete month.
 */
const mockLookups = async (
  page: Page,
  kind: 'package' | 'user',
  terms: string[],
  { trending = false } = {}
) => {
  await mockSupabaseTable(
    page,
    'popular_lookups_unique_people',
    terms.map((term, i) => ({ term, kind, unique_people: terms.length - i }))
  );
  await mockSupabaseTable(
    page,
    'latest_unique_lookups',
    terms.map((term, i) => ({ term, kind, created_at: hoursAgo(i * 24 + 1) }))
  );
  await mockSupabaseTable(
    page,
    'trending_lookups_24h',
    trending ? terms.map((term) => ({ term, kind, hits: 1 })) : []
  );
};
const open = async (page: Page, path: string) => {
  await page.goto(path);
  await waitForApp(page);
};

test.beforeEach(async ({ page }) => {
  await mockPackages(page, { speccer: {}, '@phun-ky/speccer': {} });
  await mockUser(page, 'phun-ky', ['speccer', '@phun-ky/speccer']);
});

test.describe('/packages', () => {
  test('shows the most looked up with npm data, and the latest', async ({
    page
  }) => {
    await mockLookups(page, 'package', ['speccer', '@phun-ky/speccer'], {
      trending: true
    });
    await open(page, '/packages');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Packages'
    );
    await expect(
      page.getByRole('navigation', { name: 'Main' }).getByRole('link', {
        name: 'Packages'
      })
    ).toHaveAttribute('aria-current', 'page');

    const tiles = page.locator('.discover-tile');

    await expect(tiles).toHaveCount(2);
    await expect(tiles.first()).toContainText('The speccer package');
    await expect(tiles.first()).toContainText('3K');
    await expect(tiles.first()).toContainText('looked up by 2 people');
    await expect(tiles.nth(1)).toContainText('looked up by 1 person');
    await expect(
      tiles.first().getByRole('link', { name: 'speccer' })
    ).toHaveAttribute('href', '/packages/speccer');

    await expect(page.locator('.discover-trending')).toContainText(
      'Trending in the last 24 hours'
    );

    const latest = page.locator('section', {
      has: page.getByRole('heading', { name: 'Latest lookups' })
    });

    await expect(latest.getByRole('listitem')).toHaveCount(2);
    await expect(
      latest.getByRole('link', { name: '@phun-ky/speccer' })
    ).toHaveAttribute('href', '/packages/@phun-ky/speccer');
  });

  test('says so when nothing has been looked up', async ({ page }) => {
    await open(page, '/packages');

    await expect(page.locator('.discover-trending')).toHaveText(
      'Nothing trending in the last 24 hours'
    );
    await expect(page.locator('.discover-empty')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Latest lookups' })
    ).toHaveCount(0);
  });

  test('opens a package searched for', async ({ page }) => {
    await open(page, '/packages');
    await page.getByRole('searchbox', { name: 'Package name' }).fill('speccer');
    await page.getByRole('button', { name: 'Show me' }).click();

    await expect(page).toHaveURL('/packages/speccer');
  });

  test('stays, and says so, when no package is found', async ({ page }) => {
    await open(page, '/packages');

    const input = page.getByRole('searchbox', { name: 'Package name' });

    await input.fill('phun-ky');
    await input.press('Enter');

    // phun-ky is a user, not a package
    await expect(page.getByRole('status')).toHaveText(
      'No npm package called “phun-ky”.'
    );
    await expect(page).toHaveURL('/packages');
  });

  test('says what the start page could not find', async ({ page }) => {
    await open(page, '/packages?q=nothing-here');

    await expect(
      page.getByRole('searchbox', { name: 'Package name' })
    ).toHaveValue('nothing-here');
    await expect(page.getByRole('status')).toHaveText(
      'No npm package called “nothing-here”.'
    );
  });
});

test.describe('/users', () => {
  test('shows the most looked up with what they maintain', async ({ page }) => {
    await mockLookups(page, 'user', ['phun-ky']);
    await open(page, '/users');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Users');

    const tile = page.locator('.discover-tile');

    await expect(tile).toHaveCount(1);
    await expect(tile).toContainText('2 packages, 6K downloads in 30 days');
    await expect(
      tile.getByRole('list', { name: 'Top packages' }).getByRole('link')
    ).toHaveText(['speccer', '@phun-ky/speccer']);
    await expect(
      tile.getByRole('link', { name: 'phun-ky', exact: true })
    ).toHaveAttribute('href', '/users/phun-ky');
  });

  test('opens a user searched for, and not a package', async ({ page }) => {
    await open(page, '/users');

    const input = page.getByRole('searchbox', { name: 'npm username' });

    await input.fill('speccer');
    await input.press('Enter');
    await expect(page.getByRole('status')).toHaveText(
      'No npm user with packages called “speccer”.'
    );

    await input.fill('phun-ky');
    await input.press('Enter');
    await expect(page).toHaveURL('/users/phun-ky');
  });
});

for (const [path, kind, terms] of [
  ['/packages', 'package', ['speccer', '@phun-ky/speccer']],
  ['/users', 'user', ['phun-ky']]
] as const) {
  test.describe(`${path} with lookups`, () => {
    test.beforeEach(async ({ page }) => {
      await mockLookups(page, kind, [...terms], { trending: true });
    });

    test('fits a phone without scrolling sideways', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await open(page, path);
      await expect(page.locator('.discover-tile').first()).toBeVisible();

      const { inner, scroll } = await page.evaluate(() => ({
        inner: window.innerWidth,
        scroll: document.documentElement.scrollWidth
      }));

      expect(scroll).toBeLessThanOrEqual(inner);
    });

    for (const theme of ['dark', 'light']) {
      test(`has no accessibility violations in ${theme}`, async ({ page }) => {
        await open(page, path);
        await page.evaluate(
          (choice) => localStorage.setItem('prefers-color-scheme', choice),
          theme
        );
        await page.reload();
        await waitForApp(page);
        await expect(page.locator('.discover-tile').first()).toBeVisible();

        const { violations } = await new AxeBuilder({ page })
          .options({ preload: false })
          .analyze();

        expect(
          violations.map(
            (violation) =>
              `${violation.impact} ${violation.id}: ${violation.nodes
                .map((node) => node.target.join(' '))
                .join(', ')}`
          )
        ).toEqual([]);
      });
    }
  });
}
