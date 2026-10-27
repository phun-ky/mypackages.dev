import { routes } from '../../src/lib/spa/router/routes';

import { expect, test, waitForApp } from './fixtures';
import { mockPackages, mockUser } from './mocks';

// Every public page, and the pages for a package and a user with data
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
// Known bugs, fixed on their own branch. A test marked here must fail, so
// remove the entry when the bug is fixed.
const KNOWN_BUGS: Record<string, string[]> = {};
const knownBug = (path: string, title: string) =>
  test.fail(KNOWN_BUGS[path]?.includes(title) ?? false, 'Known bug');

test.beforeEach(async ({ page }) => {
  await mockPackages(page, { speccer: {}, '@phun-ky/speccer': {} });
  await mockUser(page, 'phun-ky', ['speccer', '@phun-ky/speccer']);
});

for (const path of PAGES) {
  test.describe(path, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
      await waitForApp(page);
    });

    test('has a title', async ({ page }) => {
      knownBug(path, 'has a title');

      await expect(page).toHaveTitle(/My packages/);
    });

    test('has one main heading', async ({ page }) => {
      knownBug(path, 'has one main heading');

      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    });

    test('has unique ids', async ({ page }) => {
      knownBug(path, 'has unique ids');

      const ids = await page
        .locator('[id]')
        .evaluateAll((els) => els.map((el) => el.id));

      expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    });
  });
}
