import { expect, mockSupabaseTable, test, waitForApp } from './fixtures';

// As the portfolio-snapshot function writes it (#67)
const SNAPSHOT = {
  computed_at: '2026-10-21T06:10:47Z',
  package_count: 24,
  monthly_downloads: 1935479,
  change_pct: 11.3,
  months: [
    { month: '2026-08', downloads: 1700000 },
    { month: '2026-09', downloads: 1831148 }
  ],
  top_packages: [
    { name: '@phun-ky/typeof', monthly: 1898028, change_pct: 11.6 },
    { name: 'grunt-retire', monthly: 15809, change_pct: 37.3 }
  ]
};

test.describe('example portfolio', () => {
  test('shows the daily snapshot', async ({ page }) => {
    await mockSupabaseTable(page, 'portfolio_snapshots', [SNAPSHOT]);
    await page.goto('/');
    await waitForApp(page);

    const example = page.locator('#portfolio-example');

    await expect(example).toContainText('1.9M');
    await expect(example).toContainText('▲ 11.3%');
    await expect(example).toContainText('24');
    await expect(
      example.getByRole('link', { name: '@phun-ky/typeof' })
    ).toHaveAttribute('href', '/packages/@phun-ky/typeof');
    await expect(
      example.getByRole('img', {
        name: 'Monthly downloads for the last 2 months'
      })
    ).toBeVisible();
    await expect(example).toContainText('Numbers from 21 October 2026');
  });

  test('says what a search shows without a snapshot', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    await expect(page.locator('#portfolio-example')).toContainText(
      'Search for a user to see their downloads, packages and trends.'
    );
  });
});

test('has the sections of the front page', async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'See how your npm packages are really doing'
  );
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'What one search gets you',
    'What it does',
    'How it works',
    "What it is, and what it isn't",
    'What people look up',
    'Coming next',
    'Start with one package.'
  ]);
});

test('the theme toggle switches the theme and remembers it', async ({
  page
}) => {
  await page.addInitScript(() => {
    // Only on the first load, so the reload below shows what was stored
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('prefers-color-scheme', 'dark');
      sessionStorage.setItem('seeded', '1');
    }
  });
  await page.goto('/');
  await waitForApp(page);

  const html = page.locator('html');
  const toggle = page.locator('#theme-toggle');

  await expect(html).not.toHaveClass(/theme--light/);
  await expect(toggle).toHaveAccessibleName('Switch to the light theme');

  await toggle.click();

  await expect(html).toHaveClass(/theme--light/);
  await expect(toggle).toHaveAccessibleName('Switch to the dark theme');
  expect(
    await page.evaluate(() => localStorage.getItem('prefers-color-scheme'))
  ).toBe('light');

  await page.reload();
  await waitForApp(page);
  await expect(html).toHaveClass(/theme--light/);

  await page.locator('#theme-toggle').click();
  await expect(html).not.toHaveClass(/theme--light/);
});

test('the call to action goes back to the search', async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);

  await page.getByRole('button', { name: 'Search packages' }).click();

  await expect(
    page.getByRole('searchbox', { name: 'Package or npm username' })
  ).toBeFocused();
});
