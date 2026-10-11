import AxeBuilder from '@axe-core/playwright';

import { routes } from '../../src/lib/spa/router/routes';

import { expect, mockSupabaseFunction, test, waitForApp } from './fixtures';

const PAGES = [
  ...routes
    .filter((route) => route.public && !route.path.includes(':'))
    .map((route) => route.path),
  '/packages/speccer',
  '/users/phun-ky',
  '/this-does-not-exist'
];

test.beforeEach(async ({ page }) => {
  // A user without packages
  await mockSupabaseFunction(page, 'npm-search-by-user-role', {
    ok: true,
    data: { objects: [], total: 0 }
  });
});

for (const path of PAGES) {
  test.describe(path, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
      await waitForApp(page);
    });

    test('has no accessibility violations', async ({ page }) => {
      // Without preload, axe doesn't fetch the stylesheets again, which the
      // CSP blocks for Google Fonts
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

    test('labels every form field', async ({ page }) => {
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
