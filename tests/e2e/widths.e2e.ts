import { routes } from '../../src/lib/spa/router/routes';

import { expect, test, waitForApp } from './fixtures';
import { mockPackages, mockUser } from './mocks';

// No page scrolls sideways at a phone, tablet or desktop width (#59), in
// either theme, with a screenshot of each in the HTML report (#43)
const WIDTHS = [390, 768, 1440];
const THEMES = ['light', 'dark'] as const;
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

// No theme transition to wait for, so a screenshot never catches one halfway
test.use({ reducedMotion: 'reduce' });

test.beforeEach(async ({ page }) => {
  await mockPackages(page, { speccer: {}, '@phun-ky/speccer': {} });
  await mockUser(page, 'phun-ky', ['speccer', '@phun-ky/speccer']);
});

for (const path of PAGES) {
  for (const theme of THEMES) {
    test(`${path} in ${theme} doesn't scroll sideways`, async ({
      page,
      browserName
    }, testInfo) => {
      // As index.html reads it: the visitor's choice
      await page.addInitScript(
        (choice) => localStorage.setItem('prefers-color-scheme', choice),
        theme
      );
      await page.goto(path);
      await waitForApp(page);
      await expect(page.locator('html')).toHaveClass(
        theme === 'light' ? /theme--light/ : /^(?!.*theme--light)/
      );

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });

        // The page is laid out at the width asked for, not a default one
        await expect
          .poll(() => page.evaluate(() => window.innerWidth))
          .toBe(width);
        await expect
          .poll(
            () =>
              page.evaluate(
                () => document.documentElement.scrollWidth - window.innerWidth
              ),
            { message: `${width} px` }
          )
          .toBeLessThanOrEqual(0);

        // One browser is enough to look at. The whole page in one viewport:
        // Chromium's full-page screenshot is stitched, and drops blurred
        // (backdrop-filter) cards where they cross a seam
        if (browserName === 'chromium') {
          const height = await page.evaluate(
            () => document.documentElement.scrollHeight
          );

          await page.setViewportSize({ width, height });
          await testInfo.attach(`${width}px ${theme}`, {
            body: await page.screenshot(),
            contentType: 'image/png'
          });
          await page.setViewportSize({ width, height: 900 });
        }
      }
    });
  }
}
