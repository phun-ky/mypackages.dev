import { expect, test, waitForApp } from './fixtures';
import { mockPackages, mockUser } from './mocks';

// Every page sets its own title, description and canonical URL (#40), also
// the ones the build can't prerender, and on navigation within the app
test.beforeEach(async ({ page }) => {
  await mockPackages(page, { speccer: {}, '@phun-ky/speccer': {} });
  await mockUser(page, 'phun-ky', ['speccer', '@phun-ky/speccer']);
});

const head = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ({
    title: document.title,
    description: document
      .querySelector('meta[name="description"]')
      ?.getAttribute('content'),
    canonical: document
      .querySelector('link[rel="canonical"]')
      ?.getAttribute('href'),
    robots: document
      .querySelector('meta[name="robots"]')
      ?.getAttribute('content'),
    ogTitle: document
      .querySelector('meta[property="og:title"]')
      ?.getAttribute('content'),
    ogUrl: document
      .querySelector('meta[property="og:url"]')
      ?.getAttribute('content')
  }));

test('/help/faq has its own title and canonical URL', async ({ page }) => {
  await page.goto('/help/faq');
  await waitForApp(page);

  const tags = await head(page);
  const url = 'https://mypackages.dev/help/faq';

  expect(tags).toMatchObject({
    title: 'Questions and answers · My packages',
    canonical: url,
    ogTitle: 'Questions and answers · My packages',
    ogUrl: url,
    robots: undefined
  });
  expect(tags.description).toBeTruthy();
});

// Served from 404.html with status 404 (#39): their own title and link
// preview, but kept out of search engines, without a canonical URL
for (const [path, title] of [
  ['/packages/@phun-ky/speccer', '@phun-ky/speccer · My packages'],
  ['/users/phun-ky', 'phun-ky · My packages'],
  ['/users/phun-ky/packages', 'Packages by phun-ky · My packages']
]) {
  test(`${path} has its own title, and stays out of search engines`, async ({
    page
  }) => {
    await page.goto(path);
    await waitForApp(page);

    const tags = await head(page);

    expect(tags).toMatchObject({
      title,
      ogTitle: title,
      ogUrl: `https://mypackages.dev${path}`,
      robots: 'noindex',
      canonical: undefined
    });
    expect(tags.description).toBeTruthy();
  });
}

test('changes the title and canonical URL on navigation', async ({ page }) => {
  await page.goto('/help');
  await waitForApp(page);
  await page
    .getByRole('link', { name: /questions and answers/i })
    .first()
    .click();
  await expect(page).toHaveTitle('Questions and answers · My packages');
  expect((await head(page)).canonical).toBe('https://mypackages.dev/help/faq');
});

test('keeps a page that is not found out of search engines', async ({
  page
}) => {
  await page.goto('/this-does-not-exist');
  await waitForApp(page);

  const tags = await head(page);

  expect(tags.title).toBe('Page not found · My packages');
  expect(tags.robots).toBe('noindex');
  expect(tags.canonical).toBeUndefined();
});
