import { searchResponse } from './data/npm';
import { expect, mockSupabaseFunction, test, waitForApp } from './fixtures';
import { mockPackages } from './mocks';

// The page shown when a page fails to render (#109)

// The router logs the error it shows; Firefox logs only its name
const removeLoggedError = (errors: string[]) =>
  errors.splice(
    0,
    errors.length,
    ...errors.filter(
      (error) =>
        !error.includes('Search failed: 503') &&
        error !== 'console.error: Error'
    )
  );

test('says what failed, keeps the header, and tries again', async ({
  page,
  pageErrors
}) => {
  let fail = true;

  await mockPackages(page, { speccer: {} });
  await mockSupabaseFunction(page, 'npm-search-by-user-role', (body) =>
    fail
      ? { ok: false, error: 'Search failed: 503' }
      : { ok: true, data: searchResponse(String(body.username), ['speccer']) }
  );
  await page.goto('/users/phun-ky');
  await waitForApp(page);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Something went wrong'
  );
  await expect(page.locator('.error-what')).toContainText('Search failed: 503');
  await expect(page.locator('main')).not.toContainText('[object Object]');
  // The site header, as the banner, on the error page too
  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(
    page.getByRole('link', { name: 'Report it on GitHub' })
  ).toHaveAttribute('href', /Search\+failed%3A\+503/);

  const details = page.locator('.error-details');

  await expect(details.locator('dd').first()).not.toBeVisible();
  await details.locator('summary').click();
  await expect(details).toContainText('Search failed: 503');

  fail = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('phun-ky');
  await expect(page).toHaveURL('/users/phun-ky');

  removeLoggedError(pageErrors);
});

test('a page not found has the site header and ways on', async ({ page }) => {
  await page.goto('/no/such/page');
  await waitForApp(page);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Page not found'
  );
  await expect(page.locator('.error-lede code')).toHaveText('/no/such/page');
  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(
    page.getByRole('link', { name: 'Go to the start page' })
  ).toHaveAttribute('href', '/');
});
