import type { Page } from '@playwright/test';

import { expect, test, waitForApp } from './fixtures';

// After a deploy, GitHub Pages no longer has the previous build's files, and
// answers a request for one with 404.html (#82). The users page is loaded on
// demand, so it stands in for any page an open tab hasn't loaded yet.
const PAGE_FILE = '**/assets/UsersPage-*.js';
/**
 * Answers the page file like GitHub Pages does after a deploy: with 404.html,
 * for every request from the page that is open now. With `untilReload`, a
 * reloaded page gets the file, like a page that loads the new build.
 */
const removeFromDeploy = async (page: Page, { untilReload = false }) => {
  const notFound = await (await page.request.get('/404.html')).text();

  let reloaded = false;

  // A reload asks the server for the page, before anything else on it.
  // Following a link in the app changes the URL without a request.
  page.on('request', (request) => {
    if (request.isNavigationRequest()) reloaded = true;
  });
  // Vite preloads the file and then imports it, so both requests fail
  await page.route(PAGE_FILE, (route) =>
    untilReload && reloaded
      ? route.continue()
      : route.fulfill({ status: 404, contentType: 'text/html', body: notFound })
  );
};
/**
 * Removes the errors these tests cause on purpose: the 404s for the page
 * file, and the browser refusing to run HTML as a module.
 */
const EXPECTED_ERRORS =
  /UsersPage-.*\.js|MIME type|module script|dynamically imported module/i;
const removeExpectedErrors = (errors: string[]) => {
  errors.splice(
    0,
    errors.length,
    ...errors.filter((error) => !EXPECTED_ERRORS.test(error))
  );
};
// A mark on the open page, lost when it reloads
const markPage = (page: Page) =>
  page.evaluate(() => {
    (window as { __openPage?: boolean }).__openPage = true;
  });
const isSamePage = (page: Page) =>
  page.evaluate(() => (window as { __openPage?: boolean }).__openPage === true);
// A reload loads the whole app again, so give it longer than the default
// under load (#89)
const RELOAD_TIMEOUT = 15_000;
const followUsersLink = (page: Page) =>
  page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Users' })
    .click();

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);
  await markPage(page);
});

test('reloads once to load a page removed by a deploy', async ({
  page,
  pageErrors
}) => {
  await removeFromDeploy(page, { untilReload: true });
  await followUsersLink(page);

  await expect(page).toHaveURL('/users');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Users' })
  ).toBeVisible({ timeout: RELOAD_TIMEOUT });
  expect(await isSamePage(page)).toBe(false);

  removeExpectedErrors(pageErrors);
});

test('shows the error page if the reload does not help', async ({
  page,
  pageErrors
}) => {
  await removeFromDeploy(page, { untilReload: false });
  await followUsersLink(page);

  // Reloaded once, and then gave up: reloading again would have left the
  // error page unshown
  await expect(
    page.getByRole('heading', { level: 1, name: 'Something went wrong' })
  ).toBeVisible({ timeout: RELOAD_TIMEOUT });
  expect(await isSamePage(page)).toBe(false);

  removeExpectedErrors(pageErrors);
  // The app logs the error it shows; Firefox reports the object as
  // "JSHandle@object"
  pageErrors.splice(
    0,
    pageErrors.length,
    ...pageErrors.filter((e) => e !== 'console.error: JSHandle@object')
  );
});
