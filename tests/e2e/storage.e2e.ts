import { expect, test, waitForApp } from './fixtures';
import { mockPackages, mockUser, signIn } from './mocks';

// What the site keeps in localStorage (#112), and whose packages go where
// (#113)
const own = (page: import('@playwright/test').Page) =>
  page.evaluate(() =>
    Object.keys(localStorage)
      .filter((key) => key.startsWith('npmdash:'))
      .reduce(
        (sum, key) => sum + key.length + localStorage.getItem(key)!.length,
        0
      )
  );
const tracked = (page: import('@playwright/test').Page, username: string) =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.v ?? null,
    `npmdash:tracked-packages:v2:${username}`
  );

test.describe('a signed-in user’s own packages', () => {
  test.beforeEach(async ({ page }) => {
    await mockPackages(page, { speccer: {}, mine: {} });
    await signIn(page, { npmUsername: 'someone', ensuredPackages: ['mine'] });
  });

  test('stay off other users’ pages', async ({ page }) => {
    await mockUser(page, 'phun-ky', ['speccer']);
    await page.goto('/users/phun-ky');
    await waitForApp(page);

    await expect(page.locator('#package-rows tr')).toHaveCount(1);
    await expect(page.locator('#package-rows')).not.toContainText('mine');
    expect(await tracked(page, 'phun-ky')).toEqual(['speccer']);
  });

  test('show on their own page', async ({ page }) => {
    await mockUser(page, 'someone', ['speccer']);
    await page.goto('/users/someone');
    await waitForApp(page);

    await expect(page.locator('#package-rows tr')).toHaveCount(2);
    await expect(page.locator('#package-rows')).toContainText('mine');
    // Read from the profile each time, not stored with the search's
    expect(await tracked(page, 'someone')).toEqual(['speccer']);
  });
});

test('keeps localStorage small with large packuments', async ({ page }) => {
  // 50 packages with a 500,000 character README each: 25 MB of packuments
  const names = Array.from({ length: 50 }, (_, i) => `big-${i}`);
  const warnings: string[] = [];

  page.on('console', (message) => {
    if (message.text().includes('cache set failed'))
      warnings.push(message.text());
  });
  await mockPackages(
    page,
    Object.fromEntries(
      names.map((name) => [name, { readme: 'r'.repeat(500_000) }])
    )
  );
  await mockUser(page, 'big', names);
  await page.goto('/users/big');
  await waitForApp(page, { timeout: 30_000 });
  await expect(page.locator('#package-rows tr')).toHaveCount(50);

  expect(warnings).toEqual([]);
  // Characters, as browsers count the quota: about 5 million
  expect(await own(page)).toBeLessThan(1_000_000);
});

test('clears what older builds left behind', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;

    sessionStorage.setItem('seeded', '1');

    const later = Date.now() + 1e9;
    const entry = (v: unknown, exp = later) => JSON.stringify({ v, exp });

    // A list from before #113, a whole packument, and an expired entry
    localStorage.setItem(
      'npmdash:tracked-packages:phun-ky:maintainer',
      entry(['speccer', 'not-theirs'])
    );
    localStorage.setItem('npmdash:registry:huge', entry('x'.repeat(200_000)));
    localStorage.setItem('npmdash:registry:old', entry({}, Date.now() - 1));
    localStorage.setItem('prefers-color-scheme', 'dark');
  });
  await page.goto('/help');
  await waitForApp(page);

  expect(
    await page.evaluate(() =>
      [
        'npmdash:tracked-packages:phun-ky:maintainer',
        'npmdash:registry:huge',
        'npmdash:registry:old',
        'prefers-color-scheme'
      ].map((key) => localStorage.getItem(key) !== null)
    )
  ).toEqual([false, false, false, true]);
});
