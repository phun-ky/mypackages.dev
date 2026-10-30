import type { Page } from '@playwright/test';

import { lastYearDownloads, packument, searchResponse } from './data/npm';
import { session, STORAGE_KEY, user } from './data/session';
import { mockJson, mockSupabaseFunction, mockSupabaseTable } from './fixtures';

/**
 * Mocks the npm, OSV and GitHub data for `packages`, a map from package name
 * to fields that replace the defaults in `packument`. Other packages don't
 * exist.
 */
export const mockPackages = async (
  page: Page,
  packages: Record<string, Record<string, unknown>>
): Promise<void> => {
  const exists = (name: unknown): name is string =>
    typeof name === 'string' && Object.hasOwn(packages, name);

  await mockSupabaseFunction(page, 'npm-package-details', ({ name }) =>
    exists(name)
      ? { ok: true, data: packument(name, packages[name]) }
      : { ok: false, status: 404, body: 'Not found' }
  );
  await mockSupabaseFunction(page, 'npm-downloads-last-year', ({ name }) => ({
    ok: true,
    data: lastYearDownloads(String(name))
  }));
  await mockSupabaseFunction(page, 'npm-downloads-last-month', ({ name }) => ({
    ok: true,
    data: { downloads: 3000, package: name }
  }));
  await mockSupabaseFunction(page, 'npm-exists-package', ({ packageName }) => ({
    ok: true,
    exists: exists(packageName)
  }));
  await mockJson(page, 'https://api.osv.dev/v1/query', { vulns: [] });
  await mockJson(page, 'https://api.github.com/repos/**', {
    stargazers_count: 42,
    forks_count: 1,
    open_issues_count: 3,
    subscribers_count: 2
  });
  // Scoped names are also looked up as GitHub packages, which need auth
  await mockJson(
    page,
    'https://api.github.com/orgs/**',
    { message: 'Not Found' },
    404
  );
};

/**
 * Mocks the npm search so `username` maintains `names`, and no one else
 * maintains anything. Mock the packages themselves with `mockPackages`.
 * With `total`, npm has that many, and the search returned only `names`.
 */
export const mockUser = async (
  page: Page,
  username: string,
  names: string[],
  { total = names.length } = {}
): Promise<void> => {
  await mockSupabaseFunction(page, 'npm-search-by-user-role', (body) => ({
    ok: true,
    data:
      body.username === username
        ? searchResponse(username, names, total)
        : searchResponse(username, [])
  }));
  await mockSupabaseFunction(page, 'npm-user-has-packages', (body) => ({
    ok: true,
    hasPackages: body.username === username && names.length > 0
  }));
};

/**
 * Signs `user` in, as supabase-js keeps the session, with the "Show profile
 * pictures" setting (#37) as given.
 */
export const signIn = async (
  page: Page,
  { showProfilePictures = false } = {}
): Promise<void> => {
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: STORAGE_KEY, value: JSON.stringify(session) }
  );
  await page.route('**/auth/v1/user', (route) => route.fulfill({ json: user }));
  await mockSupabaseTable(page, 'user_settings', [
    { user_id: user.id, show_profile_pictures: showProfilePictures }
  ]);
};
