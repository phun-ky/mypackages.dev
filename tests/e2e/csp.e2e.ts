import type { Page } from '@playwright/test';

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { routes } from '../../src/lib/spa/router/routes';

import { ALLOWED_ORIGINS } from './data/origins';
import { expect, test, waitForApp } from './fixtures';
import { mockPackages, mockUser } from './mocks';

// Every public page, and the pages for a package and a user with data
const PAGES = [
  ...routes
    .filter((route) => route.public && !route.path.includes(':'))
    .map((route) => route.path),
  '/packages/@phun-ky/speccer',
  '/users/phun-ky',
  '/users/phun-ky/packages',
  '/this-does-not-exist'
];
/** The policy the page was served with, by directive. */
const readPolicy = async (page: Page) => {
  const content = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content');

  return new Map(
    (content ?? '')
      .split(';')
      .map((part) => part.trim().split(/\s+/))
      .filter(([name]) => name)
      .map(([name, ...sources]) => [name, sources])
  );
};
const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? sourceFiles(join(dir, entry.name))
      : entry.name.endsWith('.ts')
        ? [join(dir, entry.name)]
        : []
  );

test.beforeEach(async ({ page }) => {
  await mockPackages(page, { '@phun-ky/speccer': {} });
  await mockUser(page, 'phun-ky', ['@phun-ky/speccer']);
  // Collect violations from the first script on, before the app runs
  await page.addInitScript(() => {
    const violations: string[] = [];

    (window as { __cspViolations?: string[] }).__cspViolations = violations;
    document.addEventListener('securitypolicyviolation', (event) => {
      violations.push(`${event.effectiveDirective} ${event.blockedURI}`);
    });
  });
});

for (const path of PAGES) {
  test(`${path} breaks no rule of the CSP`, async ({ page }) => {
    await page.goto(path);
    await waitForApp(page);
    // Let lazy requests, like fonts and charts, start
    await page.waitForLoadState('networkidle');

    expect(
      await page.evaluate(
        () => (window as { __cspViolations?: string[] }).__cspViolations
      )
    ).toEqual([]);
  });
}

test('the CSP allows no inline scripts and no whole schemes', async ({
  page
}) => {
  await page.goto('/');
  await waitForApp(page);

  const policy = await readPolicy(page);

  expect(policy.get('script-src')).not.toContain("'unsafe-inline'");
  expect(policy.get('script-src')).not.toContain("'unsafe-eval'");
  expect(policy.has('script-src-attr')).toBe(false);
  // Only style attributes may be inline, not style elements
  expect(policy.get('style-src')).not.toContain("'unsafe-inline'");
  expect(policy.get('object-src')).toEqual(["'none'"]);

  for (const [name, sources] of policy) {
    expect(sources, name).not.toContain('https:');
    expect(sources, name).not.toContain('http:');
  }
});

test('the CSP lets the site call exactly the origins it calls', async ({
  page
}) => {
  await page.goto('/');
  await waitForApp(page);

  const connect = (await readPolicy(page)).get('connect-src') ?? [];

  expect(connect.filter((source) => source !== "'self'").sort()).toEqual(
    [...ALLOWED_ORIGINS].sort()
  );

  // Each one is called from the code, apart from the Supabase project, whose
  // address comes from the build's environment
  const code = sourceFiles('src')
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');

  for (const origin of ALLOWED_ORIGINS.filter(
    (o) => !o.endsWith('.supabase.co')
  )) {
    expect(code, origin).toContain(origin);
  }
});

test('the search forms stay on the page when submitted', async ({ page }) => {
  for (const path of ['/', '/packages']) {
    await page.goto(path);
    await waitForApp(page);
    await page.evaluate(() => {
      (window as { __openPage?: boolean }).__openPage = true;
    });

    // Submitting the form itself, as Enter does in a browser without the
    // app's keydown handler
    await page
      .getByRole('search')
      .first()
      .evaluate((form: HTMLFormElement) => form.requestSubmit());

    expect(new URL(page.url()).search, path).toBe('');
    expect(
      await page.evaluate(
        () => (window as { __openPage?: boolean }).__openPage
      ),
      path
    ).toBe(true);
  }
});
