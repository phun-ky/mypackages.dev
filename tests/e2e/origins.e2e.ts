import { routes } from '../../src/lib/spa/router/routes';

import { expect, test, waitForApp } from './fixtures';
import { mockPackages, mockUser } from './mocks';

// Every public page, and the pages for a package and a user with data
const PAGES = [
  ...routes
    .filter((route) => route.public && !route.path.includes(':'))
    .map((route) => route.path),
  '/packages/@phun-ky/speccer',
  '/users/phun-ky',
  '/this-does-not-exist'
];
// The only other origins a page may contact: the APIs the site exists to show
// data from, and its own Supabase project. Fonts, scripts, styles and images
// come from the site itself, so visitors aren't tracked by anyone else.
const ALLOWED = new Set([
  'https://zendzcuvkwbszzyjfefa.supabase.co',
  'https://registry.npmjs.org',
  'https://api.npmjs.org',
  'https://api.github.com',
  'https://gitlab.com',
  'https://api.bitbucket.org',
  'https://dev.azure.com',
  'https://api.osv.dev'
]);

test.beforeEach(async ({ page }) => {
  await mockPackages(page, { '@phun-ky/speccer': {} });
  await mockUser(page, 'phun-ky', ['@phun-ky/speccer']);
});

for (const path of PAGES) {
  test(`${path} only contacts the site and its data sources`, async ({
    page,
    baseURL
  }) => {
    const origins = new Set<string>();

    // Requests to other origins are aborted by the fixture, but still
    // reported here
    page.on('request', (request) => origins.add(new URL(request.url()).origin));
    await page.goto(path);
    await waitForApp(page);
    // Let lazy requests, like fonts and charts, start
    await page.waitForLoadState('networkidle');

    origins.delete(new URL(baseURL!).origin);
    expect([...origins].filter((origin) => !ALLOWED.has(origin))).toEqual([]);
  });
}
