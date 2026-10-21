import AxeBuilder from '@axe-core/playwright';

import { routes } from '../../src/lib/spa/router/routes';

import { expect, test, waitForApp } from './fixtures';
import { mockPackages, mockUser } from './mocks';

const PAGES = [
  ...routes
    .filter((route) => route.public && !route.path.includes(':'))
    .map((route) => route.path),
  '/packages/speccer',
  '/users/phun-ky',
  '/users/phun-ky/packages',
  '/this-does-not-exist'
];
// Known bugs, fixed on their own branch. A test marked here must fail, so
// remove the entry when the bug is fixed.
const KNOWN_BUGS: Record<string, string[]> = {
  // Unlabelled charts, and no <h1>
  '/users/phun-ky/packages': ['has no accessibility violations']
};
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

    for (const theme of ['dark', 'light']) {
      test(`has no accessibility violations in ${theme}`, async ({ page }) => {
        knownBug(path, 'has no accessibility violations');

        // As index.html reads it: the visitor's choice, or else the system's,
        // which is light in Playwright's browsers
        await page.evaluate(
          (choice) => localStorage.setItem('prefers-color-scheme', choice),
          theme
        );
        await page.reload();
        await waitForApp(page);

        await expect(page.locator('html')).toHaveClass(
          theme === 'light' ? /theme--light/ : /^(?!.*theme--light)/
        );

        // Without preload, axe doesn't fetch the stylesheets again
        const { violations } = await new AxeBuilder({ page })
          .options({ preload: false })
          .analyze();

        // One line per rule, with the elements that break it
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

    test('labels every form field', async ({ page }) => {
      knownBug(path, 'labels every form field');

      // axe accepts a placeholder as a label, but it disappears on input
      const unlabelled = await page
        .locator('input:not([type="hidden"]), select, textarea')
        .evaluateAll((els) =>
          els
            .filter(
              (el) =>
                !(el as HTMLInputElement).labels?.length &&
                !el.getAttribute('aria-label') &&
                !el.getAttribute('aria-labelledby')
            )
            .map((el) => el.outerHTML)
        );

      expect(unlabelled).toEqual([]);
    });

    test('has no block elements in headings', async ({ page }) => {
      knownBug(path, 'has no block elements in headings');

      // Browsers render these, but headings may only hold phrasing content
      const invalid = await page
        .locator(
          ':is(h1, h2, h3, h4, h5, h6) :is(p, div, ul, ol, section, h1, h2, h3, h4, h5, h6)'
        )
        .evaluateAll((els) =>
          els.map((el) => el.parentElement?.outerHTML.slice(0, 120))
        );

      expect(invalid).toEqual([]);
    });
  });
}
