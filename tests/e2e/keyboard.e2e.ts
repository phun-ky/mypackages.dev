import type { Page } from '@playwright/test';

import { expect, test, waitForApp } from './fixtures';
import { mockPackages, mockUser, signIn } from './mocks';

// Keyboard use and reduced motion (#44), beyond what axe checks
const PAGES = [
  '/',
  '/packages',
  '/packages/speccer',
  '/users',
  '/users/phun-ky',
  '/help',
  '/help/faq'
];
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

test.beforeEach(async ({ page }) => {
  await mockPackages(page, { speccer: {}, '@phun-ky/speccer': {} });
  await mockUser(page, 'phun-ky', ['speccer', '@phun-ky/speccer']);
});

const open = async (page: Page, path: string) => {
  await page.goto(path);
  await waitForApp(page);
};
// What can show focus: the element, its wrappers (a search field shows it
// with :focus-within), and the label after a visually hidden checkbox
const focusLook = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const props = [
      'outline-style',
      'outline-width',
      'outline-color',
      'box-shadow',
      'border-color',
      'background-color',
      'color',
      'text-decoration-line'
    ];
    const look = (node: Element | null, pseudo?: string) => {
      if (!node) return '';

      const style = getComputedStyle(node, pseudo);

      return props.map((prop) => style.getPropertyValue(prop)).join('|');
    };

    return [
      el,
      el.parentElement,
      el.parentElement?.parentElement ?? null,
      el.nextElementSibling
    ]
      .flatMap((node) => [
        look(node),
        look(node, '::before'),
        look(node, '::after')
      ])
      .join('\n');
  });

test.describe('keyboard', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'Firefox on Linux skips links when tabbing, unlike its default elsewhere'
  );

  for (const path of PAGES) {
    test(`${path}: the skip link comes first and skips the header`, async ({
      page
    }) => {
      await open(page, path);
      await page.keyboard.press('Tab');

      const skip = page.getByRole('link', { name: 'Skip to content' });

      await expect(skip).toBeFocused();
      await expect(skip).toBeInViewport();

      await page.keyboard.press('Enter');
      await expect
        .poll(() =>
          page.evaluate(() =>
            document.activeElement?.closest('main') &&
            !document.activeElement.closest('header, .site-header')
              ? document.activeElement.tagName
              : null
          )
        )
        .toMatch(/^(H1|MAIN)$/);
    });

    test(`${path}: Tab reaches every control, and each shows focus`, async ({
      page
    }) => {
      await open(page, path);

      // Every control a pointer could use: visible, not inert
      const controls = await page.evaluate((selector) => {
        const visible = [...document.querySelectorAll<HTMLElement>(selector)]
          .filter((el) => el.checkVisibility({ visibilityProperty: true }))
          .filter((el) => !el.closest('[inert], [aria-hidden="true"]'));

        visible.forEach((el, i) => el.setAttribute('data-kb', String(i)));

        return visible.length;
      }, FOCUSABLE);
      const reached = new Set<string>();
      const unseen: string[] = [];

      for (let i = 0; i < controls + 10 && reached.size < controls; i++) {
        await page.keyboard.press('Tab');

        const id = await page.evaluate(
          () => document.activeElement?.getAttribute('data-kb') ?? null
        );

        if (id === null || reached.has(id)) continue;

        reached.add(id);

        const focused = await focusLook(page);
        const name = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;

          return `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40)}"`;
        });

        // Blur keeps the place in the Tab order, so the next Tab goes on
        await page.evaluate(() =>
          (document.activeElement as HTMLElement).blur()
        );

        if ((await focusLook(page)) === focused) unseen.push(name);
      }

      const missed = await page.evaluate(
        (ids) =>
          [...document.querySelectorAll<HTMLElement>('[data-kb]')]
            .filter((el) => !ids.includes(el.getAttribute('data-kb')!))
            .map((el) => el.outerHTML.slice(0, 120)),
        [...reached]
      );

      expect(missed, 'controls Tab never reaches').toEqual([]);
      expect(unseen, 'controls that look the same focused').toEqual([]);
    });
  }

  test('Escape closes the profile menu and gives focus back', async ({
    page
  }) => {
    await signIn(page);
    await open(page, '/profile');

    const toggle = page.locator('[aria-controls="profile-menu-menu"]');

    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const path of PAGES) {
    test(`${path} doesn't animate or scroll smoothly`, async ({ page }) => {
      await open(page, path);

      // What every element and pseudo-element declares, not only what runs
      // now: a hover transition or the loader only move later
      const motion = await page.evaluate(() => {
        const longest = (value: string) =>
          Math.max(
            ...value
              .split(',')
              .map((v) => parseFloat(v) * (v.trim().endsWith('ms') ? 1 : 1000))
          );
        const moving = new Set<string>();

        for (const el of document.querySelectorAll('*')) {
          for (const pseudo of [undefined, '::before', '::after']) {
            const style = getComputedStyle(el, pseudo);
            const name = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/)[0]}` : ''}${pseudo ?? ''}`;

            if (
              style.animationName !== 'none' &&
              longest(style.animationDuration) > 1
            )
              moving.add(`${name} animation ${style.animationName}`);

            if (longest(style.transitionDuration) > 1)
              moving.add(`${name} transition ${style.transitionProperty}`);
          }
        }

        return {
          moving: [...moving].slice(0, 20),
          scrollBehavior: getComputedStyle(document.documentElement)
            .scrollBehavior
        };
      });

      expect(motion).toEqual({ moving: [], scrollBehavior: 'auto' });
    });
  }
});
