import { expect, test, waitForApp } from './fixtures';
import { mockPackages, signIn } from './mocks';

// Profile pictures tell GitHub and gravatar.com who looks at which page, so
// they're opt-in (#37): initials by default
const PICTURE_HOSTS = /avatars\.githubusercontent\.com|gravatar\.com/;

test.beforeEach(async ({ page }) => {
  await mockPackages(page, { speccer: {} });
});

test('shows initials and loads no pictures by default', async ({ page }) => {
  const requests: string[] = [];

  page.on('request', (request) => requests.push(request.url()));
  await signIn(page);
  // The profile menu, on the signed-in pages
  await page.goto('/profile');
  await waitForApp(page);
  await expect(page.locator('span.avatar')).toHaveText('SO');
  await expect(page.locator('img.avatar')).toHaveCount(0);

  // The maintainers on a package page
  await page.goto('/packages/speccer');
  await waitForApp(page);
  await expect(page.locator('span.report-avatar').first()).toBeVisible();
  await expect(page.locator('img.report-avatar')).toHaveCount(0);

  expect(requests.filter((url) => PICTURE_HOSTS.test(url))).toEqual([]);
});

test('shows pictures when the user turned them on', async ({ page }) => {
  await signIn(page, { showProfilePictures: true });
  await page.goto('/profile');
  await waitForApp(page);
  await expect(page.locator('img.avatar')).toHaveAttribute(
    'src',
    'https://avatars.githubusercontent.com/u/1?v=4'
  );

  await page.goto('/packages/speccer');
  await waitForApp(page);
  await expect(page.locator('img.report-avatar').first()).toHaveAttribute(
    'src',
    /^https:\/\/avatars\.githubusercontent\.com\/[^/]+\?s=72$/
  );
});

test('saves the setting from the profile page', async ({ page }) => {
  await signIn(page);

  const saved = page.waitForRequest(
    (request) =>
      request.url().includes('/rest/v1/user_settings') &&
      request.method() === 'POST'
  );

  await page.goto('/profile');
  await waitForApp(page);

  const checkbox = page.getByRole('checkbox', {
    name: 'Show profile pictures'
  });

  await expect(checkbox).not.toBeChecked();
  await checkbox.check();

  expect((await saved).postDataJSON()).toMatchObject({
    show_profile_pictures: true
  });
  await expect(page.locator('.picture-setting .status')).toHaveText(
    'Saved. Shown from the next page you open.'
  );
});
