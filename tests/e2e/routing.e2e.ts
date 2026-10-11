import { routes } from '../../src/lib/spa/router/routes';

import { expect, test, waitForApp } from './fixtures';

// Public pages without parameters, the ones a visitor can reach from the nav
const PUBLIC_PAGES = routes
  .filter((route) => route.public && !route.path.includes(':'))
  .map((route) => route.path);
const PRIVATE_PAGES = routes
  .filter((route) => !route.public && !route.path.includes(':'))
  .map((route) => route.path);
const hasRoute = (pathname: string) =>
  routes.some((route) => route.regex.test(decodeURI(pathname)));

test.describe('unknown URLs', () => {
  for (const path of ['/this-does-not-exist', '/about', '/search']) {
    test(`${path} shows the "page not found" page`, async ({ page }) => {
      await page.goto(path);
      await waitForApp(page);

      await expect(
        page.getByRole('heading', { level: 1, name: 'Page not found' })
      ).toBeVisible();
      await expect(page).toHaveURL(path);
    });
  }
});

test.describe('internal links', () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} only links to existing routes`, async ({ page, baseURL }) => {
      await page.goto(path);
      await waitForApp(page);

      // Includes links in closed menus, like the breadcrumb menus
      const pathnames = await page.locator('a[href]').evaluateAll(
        (els, origin) =>
          els
            .map((el) => new URL((el as HTMLAnchorElement).href))
            .filter((url) => url.origin === origin)
            .map((url) => url.pathname),
        new URL(baseURL as string).origin
      );

      expect(pathnames.length).toBeGreaterThan(0);
      expect(
        [...new Set(pathnames)].filter((pathname) => !hasRoute(pathname))
      ).toEqual([]);
    });
  }
});

test.describe('private pages when signed out', () => {
  for (const path of PRIVATE_PAGES) {
    test(`${path} redirects to sign in`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(
        `/dashboard/signin?returnTo=${encodeURIComponent(path)}`
      );
      await waitForApp(page);
      await expect(
        page.getByRole('heading', { level: 1, name: 'Welcome back' })
      ).toBeVisible();
    });
  }
});
