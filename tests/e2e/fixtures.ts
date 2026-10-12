import { expect, test as base, type Page, type Route } from '@playwright/test';

export { expect };

// The APIs are called from the page's origin, so answer CORS preflights too
const fulfillJson = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status: route.request().method() === 'OPTIONS' ? 204 : status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*'
    },
    contentType: 'application/json',
    body: JSON.stringify(body)
  });

/**
 * Playwright `test` with two automatic additions for every test:
 *
 * - Requests to other origins are aborted, except Supabase, which answers
 *   every request with an empty list. The tests don't depend on fonts, the
 *   npm registry or a live database, and no test writes to the real one.
 *   Register a more specific `page.route` in a test to return other data.
 * - Uncaught errors, `console.error` calls and failed local requests make the
 *   test fail, so a page that renders but throws is still caught.
 */
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [
    async ({ page, baseURL }, use) => {
      const origin = new URL(baseURL as string).origin;
      const isLocal = (url: string) => url.startsWith(origin);
      const errors: string[] = [];

      await page.route(
        (url) => !isLocal(url.href),
        (route) => route.abort()
      );
      // Registered last, so it takes precedence over the abort above
      await page.route(
        (url) => url.hostname.endsWith('.supabase.co'),
        (route) => fulfillJson(route, [])
      );

      page.on('pageerror', (error) =>
        errors.push(`pageerror: ${error.message}`)
      );
      page.on('console', (message) => {
        // Blocked and failed requests are reported as "Failed to load
        // resource"; local ones are checked through the responses below
        if (
          message.type() === 'error' &&
          !message.text().startsWith('Failed to load resource')
        )
          errors.push(`console.error: ${message.text()}`);
      });
      page.on('response', (response) => {
        // Deep links are served from 404.html with status 404, as on GitHub
        // Pages, and redirect to the app from there
        if (
          response.status() === 404 &&
          response.request().isNavigationRequest()
        )
          return;

        if (isLocal(response.url()) && response.status() >= 400)
          errors.push(`${response.status()}: ${response.url()}`);
      });

      await use(errors);

      expect(errors, 'errors on the page').toEqual([]);
    },
    { auto: true }
  ]
});

/**
 * Answers calls to a Supabase edge function with `body`, instead of the empty
 * list every other Supabase request gets. Pass a function to answer based on
 * the JSON the page sent, like a package name.
 */
export const mockSupabaseFunction = async (
  page: Page,
  name: string,
  body: object | null | ((request: Record<string, unknown>) => unknown)
): Promise<void> => {
  await page.route(`**/functions/v1/${name}`, (route) => {
    const request = route.request();

    if (typeof body !== 'function' || request.method() === 'OPTIONS')
      return fulfillJson(route, body);

    return fulfillJson(route, body(request.postDataJSON() ?? {}));
  });
};

/**
 * Answers selects from a Supabase table or view with `rows`, whatever the
 * query parameters.
 */
export const mockSupabaseTable = async (
  page: Page,
  table: string,
  rows: unknown[]
): Promise<void> => {
  await page.route(`**/rest/v1/${table}?*`, (route) =>
    fulfillJson(route, rows)
  );
};

/**
 * Answers requests to another origin, like the GitHub or OSV API, with
 * `body` as JSON.
 */
export const mockJson = async (
  page: Page,
  url: string,
  body: unknown,
  status = 200
): Promise<void> => {
  await page.route(url, (route) => fulfillJson(route, body, status));
};

/**
 * Waits until the app has rendered a page and hidden its loader.
 *
 * The renderer replaces `<div id="app">` with `<div class="app">` on the first
 * render, so wait for the class rather than the id.
 */
export const waitForApp = async (page: Page): Promise<void> => {
  await expect(page.locator('body > .app > *').first()).toBeAttached();
  await expect(page.locator('#loader-container')).not.toHaveClass(/is-visible/);
};
