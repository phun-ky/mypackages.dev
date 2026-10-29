import { lastYearDownloads } from './data/npm';
import { expect, mockSupabaseFunction, test, waitForApp } from './fixtures';
import { mockPackages, mockUser } from './mocks';

// Each mocked package has 100 downloads a day and a release a month ago
test.beforeEach(async ({ page }) => {
  await mockPackages(page, { speccer: {}, '@phun-ky/speccer': {} });
  await mockUser(page, 'phun-ky', ['speccer', '@phun-ky/speccer']);
  await page.goto('/users/phun-ky');
  await waitForApp(page);
});

// The last complete month, and the day npm's data runs to: yesterday
const now = new Date();
const lastMonth = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
);
const daysInLastMonth = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)
).getUTCDate();
const lastMonthName = lastMonth.toLocaleString('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
});
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toLocaleString(
  'en-GB',
  { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }
);
// Two packages, 100 downloads a day each
const total = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
}).format(2 * 100 * daysInLastMonth);

test('shows the totals and the packages by scope', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('phun-ky');
  await expect(page.locator('.user-total')).toContainText(total);
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

// The headline was npm's search figure, a rolling 30 days, next to a change
// and a chart in calendar months (#94)
test('says which month the headline is, and the day the data runs to', async ({
  page
}) => {
  const card = page.locator('.user-total');

  await expect(card.locator('.user-label').first()).toHaveText(
    `Downloads in ${lastMonthName}, all 2 packages`
  );
  await expect(card.locator('.user-big')).toHaveText(total);
  await expect(card.locator('.user-data-end')).toHaveText(
    `From npm, up to ${yesterday}`
  );
});

test('charts the last 12 complete months', async ({ page }) => {
  await expect(
    page.getByRole('img', {
      name: 'Monthly downloads for all packages, the last 12 complete months'
    })
  ).toBeVisible();
});

// npm's last-year starts mid-month, which charted a month of a few days
// as a drop (#93)
test('leaves out a month the downloads have only some days of', async ({
  page
}) => {
  const now = new Date();
  const from = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 12, 15);

  await mockSupabaseFunction(page, 'npm-downloads-last-year', ({ name }) => {
    const data = lastYearDownloads(String(name));

    return {
      ok: true,
      data: {
        ...data,
        downloads: data.downloads.filter(({ day }) => Date.parse(day) >= from)
      }
    };
  });
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForApp(page);

  await expect(
    page.getByRole('img', {
      name: 'Monthly downloads for all packages, the last 11 complete months'
    })
  ).toBeVisible();
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

test.describe('only the packages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users/phun-ky/packages');
    await waitForApp(page);
  });

  test('shows the packages, and links to the overview', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Packages by phun-ky'
    );
    await expect(page.locator('#packages-by-scope')).toBeVisible();
    await expect(page.locator('.user-overview')).toHaveCount(0);
    await expect(page.locator('.pkg-group-head').first()).toContainText(
      '1 package'
    );
    await expect(page.locator('.pkg-group-head').first()).not.toContainText(
      '1 packages'
    );
    await expect(
      page.getByRole('link', { name: 'Users', exact: true })
    ).toHaveAttribute('aria-current', 'page');

    await page.getByRole('link', { name: 'Overview' }).click();
    await expect(page).toHaveURL('/users/phun-ky');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('phun-ky');
  });

  test('switches to the table, and fits a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Table' }).click();

    await expect(page.locator('#package-rows tr')).toHaveCount(2);

    const { inner, scroll } = await page.evaluate(() => ({
      inner: window.innerWidth,
      scroll: document.documentElement.scrollWidth
    }));

    expect(scroll).toBeLessThanOrEqual(inner);
  });
});
