import { expect, test, waitForApp } from './fixtures';
import { mockPackages, mockUser } from './mocks';

// Each mocked package has 3,000 downloads a month and a release a month ago
test.beforeEach(async ({ page }) => {
  await mockPackages(page, { speccer: {}, '@phun-ky/speccer': {} });
  await mockUser(page, 'phun-ky', ['speccer', '@phun-ky/speccer']);
  await page.goto('/users/phun-ky');
  await waitForApp(page);
});

test('shows the totals and the packages by scope', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('phun-ky');
  await expect(page.locator('.user-total')).toContainText('6K');
  await expect(page.locator('.user-share')).toContainText('@phun-ky/speccer');

  const byScope = page.locator('#packages-by-scope');

  await expect(byScope).toBeVisible();
  await expect(byScope.getByRole('heading', { level: 3 })).toHaveText([
    '@phun-ky',
    'Unscoped'
  ]);
  await expect(
    byScope.getByRole('link', { name: '@phun-ky/speccer' })
  ).toHaveAttribute('href', '/packages/@phun-ky/speccer');
  await expect(page.locator('#packages-table')).toBeHidden();
});

test('switches to the table and back, and remembers it', async ({ page }) => {
  await page.getByRole('button', { name: 'Table' }).click();

  await expect(page.locator('#packages-table')).toBeVisible();
  await expect(page.locator('#packages-by-scope')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Table' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );

  await page.reload();
  await waitForApp(page);
  await expect(page.locator('#packages-table')).toBeVisible();

  await page.getByRole('button', { name: 'By scope' }).click();
  await expect(page.locator('#packages-by-scope')).toBeVisible();
});

test('filters the table by text and by state', async ({ page }) => {
  await page.getByRole('button', { name: 'Table' }).click();

  const rows = page.locator('#package-rows tr:not([hidden])');
  const count = page.locator('#package-count');

  await expect(rows).toHaveCount(2);

  await page.getByRole('searchbox', { name: 'Filter packages' }).fill('@phun');
  await expect(rows).toHaveCount(1);
  await expect(count).toHaveText('1');

  await page.getByRole('searchbox', { name: 'Filter packages' }).fill('');
  await page.getByRole('button', { name: /^Dormant/ }).click();
  await expect(rows).toHaveCount(0);
  await expect(count).toHaveText('0');

  await page.getByRole('button', { name: /^All/ }).click();
  await expect(rows).toHaveCount(2);
});

test('sorts the table by name, both ways', async ({ page }) => {
  await page.getByRole('button', { name: 'Table' }).click();

  const header = page.locator('th.col-name');
  const names = page.locator('#package-rows .pkg-name');

  await page.getByRole('button', { name: 'Package', exact: true }).click();
  await expect(header).toHaveAttribute('aria-sort', 'ascending');
  await expect(names).toHaveText(['@phun-ky/speccer', 'speccer']);

  await page.getByRole('button', { name: 'Package', exact: true }).click();
  await expect(header).toHaveAttribute('aria-sort', 'descending');
  await expect(names).toHaveText(['speccer', '@phun-ky/speccer']);
});

test('switches between maintained and authored packages', async ({ page }) => {
  await expect(
    page.getByRole('button', { name: 'Maintainer' })
  ).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Author' }).click();

  await expect(page.getByRole('button', { name: 'Author' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(
    await page.evaluate(
      () =>
        JSON.parse(atob(window.location.hash.replace('#options=', '')))
          .maintainer
    )
  ).toBe(false);
});

test('fits a phone without scrolling sideways', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const view of ['By scope', 'Table']) {
    await page.getByRole('button', { name: view, exact: true }).click();

    const { inner, scroll } = await page.evaluate(() => ({
      inner: window.innerWidth,
      scroll: document.documentElement.scrollWidth
    }));

    expect(scroll, `${view}: page width`).toBeLessThanOrEqual(inner);
  }
});
