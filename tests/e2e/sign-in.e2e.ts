import type { Route } from '@playwright/test';

import { session, STORAGE_KEY, user } from './data/session';
import { expect, test, waitForApp } from './fixtures';

const RETURN_TO_KEY = 'sign-in:returnTo';
const fulfill = (route: Route, body: unknown) =>
  route.fulfill({
    status: route.request().method() === 'OPTIONS' ? 204 : 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*'
    },
    contentType: 'application/json',
    body: JSON.stringify(body)
  });

test.describe('signing in with GitHub', () => {
  test('comes back to /, with a one-time code instead of tokens', async ({
    page,
    baseURL
  }) => {
    // Stay on the page instead of going to GitHub
    await page.route('**/auth/v1/authorize?*', (route) => route.abort());
    await page.goto('/dashboard/signin?returnTo=%2Fhelp%2Fabout');
    await waitForApp(page);

    // The aborted navigation leaves an error page, where storage can't be
    // read, so record what the page stores before it leaves
    const stored: Record<string, string> = {};

    await page.exposeFunction('recordStorage', (key: string, value: string) => {
      stored[key] = value;
    });
    await page.evaluate(() => {
      const setItem = Storage.prototype.setItem;

      Storage.prototype.setItem = function (key, value) {
        if (this === sessionStorage)
          (
            window as unknown as {
              recordStorage: (key: string, value: string) => void;
            }
          ).recordStorage(key, value);

        setItem.call(this, key, value);
      };
    });

    const [authorize] = await Promise.all([
      page.waitForRequest('**/auth/v1/authorize?*'),
      page.getByRole('button', { name: 'Continue with GitHub' }).click()
    ]);
    const params = new URL(authorize.url()).searchParams;

    expect(params.get('provider')).toBe('github');
    // `/` is index.html on GitHub Pages. Any other path is served by
    // 404.html, which redirects before the Supabase client reads the URL.
    expect(params.get('redirect_to')).toBe(`${new URL(baseURL!).origin}/`);
    expect(params.get('code_challenge')).toBeTruthy();
    expect(stored[RETURN_TO_KEY]).toBe('/help/about');
  });

  test('signs in on / and goes back to where sign-in started', async ({
    page
  }) => {
    const urls: string[] = [];

    page.on('request', (request) => urls.push(request.url()));
    await page.addInitScript(
      ({ storageKey, returnToKey }) => {
        // As signInWithOAuth leaves them before going to GitHub
        localStorage.setItem(
          `${storageKey}-code-verifier`,
          JSON.stringify('code-verifier')
        );
        sessionStorage.setItem(returnToKey, '/help/about');
      },
      { storageKey: STORAGE_KEY, returnToKey: RETURN_TO_KEY }
    );
    await page.route('**/auth/v1/token?grant_type=pkce', (route) =>
      fulfill(route, session)
    );
    await page.route('**/auth/v1/user', (route) => fulfill(route, user));

    await page.goto('/?code=one-time-code');

    await expect(page).toHaveURL('/help/about');
    await waitForApp(page);
    expect(
      await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
    ).toContain(session.access_token);
    expect(
      await page.evaluate((key) => sessionStorage.getItem(key), RETURN_TO_KEY)
    ).toBeNull();
    expect(
      urls.filter((url) => /access_token|refresh_token/.test(url))
    ).toEqual([]);
  });
});
