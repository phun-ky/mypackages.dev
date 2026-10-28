import { routes } from '../../src/lib/spa/router/routes';

import { expect, test, waitForApp } from './fixtures';
import { mockPackages, mockUser } from './mocks';

// No page scrolls sideways at a phone, tablet or desktop width (#59)
const WIDTHS = [390, 768, 1440];
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

test.beforeEach(async ({ page }) => {
  await mockPackages(page, { speccer: {}, '@phun-ky/speccer': {} });
  await mockUser(page, 'phun-ky', ['speccer', '@phun-ky/speccer']);
});

for (const path of PAGES) {
  test(`${path} doesn't scroll sideways`, async ({ page }) => {
    await page.goto(path);
    await waitForApp(page);

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });

      await expect
        .poll(
          () =>
            page.evaluate(
              () => document.documentElement.scrollWidth - window.innerWidth
            ),
          { message: `${width} px` }
        )
        .toBeLessThanOrEqual(0);
    }
  });
}
