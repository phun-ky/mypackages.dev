import type { Page } from '@playwright/test';

import { expect, test, waitForApp } from './fixtures';

const inViewport = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => {
    const { top, bottom } = el.getBoundingClientRect();

    return top >= 0 && bottom <= window.innerHeight;
  });

test.describe('about', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/help/about');
    await waitForApp(page);
  });

  test('says where the data comes from and how the score is made', async ({
    page
  }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'About My packages'
    );
    await expect(
      page.getByRole('navigation', { name: 'Main' }).getByRole('link', {
        name: 'About'
      })
    ).toHaveAttribute('aria-current', 'page');
    await expect(
      page.locator('.help-sources').getByRole('heading', { level: 3 })
    ).toHaveText(['npm', 'OSV', 'GitHub']);
    await expect(page.getByRole('img', { name: /^Weights:/ })).toHaveAttribute(
      'aria-label',
      'Weights: Security 30%, Maintenance 25%, Quality 25%, Provenance 10%, Popularity 10%'
    );
    await expect(
      page.getByRole('link', { name: 'How the score is worked out' })
    ).toHaveAttribute('href', '/help/faq#how-is-package-health-worked-out');
  });
});

test.describe('questions and answers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/help/faq');
    await waitForApp(page);
  });

  test('shows every answer, with quotes as written', async ({ page }) => {
    const doc = page.locator('.help-doc');

    await expect(doc.getByRole('heading', { level: 2 })).toHaveCount(6);
    await expect(doc.getByRole('heading', { level: 3 })).toHaveCount(23);
    // The old page showed `I&#39;ve` and `&quot;authored&quot;` (#64)
    await expect(
      doc.getByRole('heading', {
        name: "I've searched for a package, but it's not found?"
      })
    ).toBeVisible();
    await expect(
      doc.getByRole('heading', {
        name: 'Why are only the packages someone maintains shown, and not the ones they "authored"?'
      })
    ).toBeVisible();
    await expect(doc).not.toContainText('&#39;');
    await expect(doc).not.toContainText('&quot;');
  });

  test('links each answer', async ({ page }) => {
    await page
      .locator('#what-does-confidence-mean-in-package-health')
      .getByRole('link', { name: 'Link to this answer' })
      .click();

    await expect(page).toHaveURL(
      '/help/faq#what-does-confidence-mean-in-package-health'
    );
    expect(
      await inViewport(page, '#what-does-confidence-mean-in-package-health')
    ).toBe(true);
  });

  test('marks the topic being read', async ({ page }) => {
    await page
      .getByRole('navigation', { name: 'Help' })
      .getByRole('link', { name: 'GitHub data' })
      .click();

    await expect(
      page
        .getByRole('complementary', { name: 'On this page' })
        .getByRole('link', { name: 'GitHub data' })
    ).toHaveClass(/is-here/);
  });

  test('draws the scoring model', async ({ page }) => {
    const figure = page.locator('.help-figure');

    await expect(figure.getByRole('img', { name: /^Weights:/ })).toBeVisible();
    await expect(figure.locator('.help-bands li')).toHaveCount(4);
    await expect(figure.locator('.help-caps li')).toHaveCount(3);
  });

  test('lists the topics on a phone, without scrolling sideways', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await expect(page.getByRole('navigation', { name: 'Help' })).toBeHidden();

    const toc = page.locator('.help-contents');

    await toc.getByText('Contents').click();
    await toc.getByRole('link', { name: 'Accounts and privacy' }).click();

    await expect(page).toHaveURL('/help/faq#accounts-and-privacy');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });
});

test('opens an answer from another page at that answer', async ({ page }) => {
  await page.goto('/help/about');
  await waitForApp(page);

  await page.getByRole('link', { name: 'How the score is worked out' }).click();

  await expect(page).toHaveURL('/help/faq#how-is-package-health-worked-out');
  await expect(
    page.getByRole('heading', { name: 'How is package health worked out?' })
  ).toBeInViewport();
});

test.describe('help', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/help');
    await waitForApp(page);
  });

  test('searches the answers', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: 'Search the answers' });
    const results = page.locator('#help-results');

    await search.fill('confidence');

    await expect(results).toContainText(/\d+ answers?/);
    await results
      .getByRole('link', {
        name: 'What does "confidence" mean in package health?'
      })
      .click();

    await expect(page).toHaveURL(
      '/help/faq#what-does-confidence-mean-in-package-health'
    );
    await expect(
      page.getByRole('heading', {
        name: 'What does "confidence" mean in package health?'
      })
    ).toBeInViewport();
  });

  test('says when nothing matches', async ({ page }) => {
    await page
      .getByRole('searchbox', { name: 'Search the answers' })
      .fill('zzzz nothing');

    await expect(page.locator('#help-results')).toContainText(
      'No answers match'
    );
  });

  test('links to the FAQ, About and feedback', async ({ page }) => {
    const cards = page.locator('.help-cards');

    await expect(cards.getByRole('link')).toHaveCount(3);
    await expect(
      cards.getByRole('link', { name: /Questions and answers/ })
    ).toHaveAttribute('href', '/help/faq');
    await expect(
      page.getByRole('link', { name: 'Package health 4' })
    ).toHaveAttribute('href', '/help/faq#package-health');
  });
});
