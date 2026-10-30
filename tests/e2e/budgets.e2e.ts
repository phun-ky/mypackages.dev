import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import { expect, test, waitForApp } from './fixtures';
import { mockPackages, mockUser } from './mocks';

// Performance budgets (#41), measured on a slow phone: Chrome's mobile
// viewport with 4x CPU slowdown, 150 ms latency and 1.6 Mbit/s. Measured on
// 2026-10-30 after Shiki was removed (3 runs); sizes have about 15% margin,
// times about 25%. CLS stays at Google's "good" limit. Raise a budget only
// with the reason in the PR.
const BUDGETS = {
  // The entry script and stylesheet, gzipped as GitHub Pages serves them:
  // measured 73.4 kB and 7.3 kB
  entryJsKb: 85,
  entryCssKb: 10,
  pages: {
    // Measured 457 kB, LCP 2.95-2.99 s, CLS 0.087, TBT 88-152 ms
    '/': { transferKb: 530, lcpMs: 3800, cls: 0.1, tbtMs: 400 },
    // Measured 483 kB, LCP 3.48-3.54 s, CLS 0.078, TBT 171-224 ms
    '/packages/speccer': {
      transferKb: 560,
      lcpMs: 4400,
      cls: 0.1,
      tbtMs: 400
    }
  }
} as const;

test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'Throttling and the metrics need Chrome'
);

test.beforeEach(async ({ page }) => {
  await mockPackages(page, { speccer: {} });
  await mockUser(page, 'phun-ky', ['speccer']);
});

const gzipKb = async (file: string) =>
  gzipSync(await readFile(file)).length / 1024;

test('the entry script and stylesheet stay within budget', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  const entry = (ext: string) => {
    const match = html.match(new RegExp(`/assets/(index-[\\w-]+\\.${ext})`));

    expect(match, `index.html loads an entry .${ext}`).not.toBeNull();

    return join('dist/assets', match![1]);
  };
  const js = await gzipKb(entry('js'));
  const css = await gzipKb(entry('css'));

  test.info().annotations.push({
    type: 'entry',
    description: `js ${js.toFixed(1)} kB, css ${css.toFixed(1)} kB gzipped`
  });
  expect(js, 'entry JS, kB gzipped').toBeLessThanOrEqual(BUDGETS.entryJsKb);
  expect(css, 'entry CSS, kB gzipped').toBeLessThanOrEqual(BUDGETS.entryCssKb);
});

test('no language grammars or other unused chunks are deployed', async () => {
  // Shiki shipped a chunk per language and theme, 17 MB in all (#41)
  const files = await readdir('dist/assets');

  expect(files.length).toBeLessThan(120);
});

for (const [path, budget] of Object.entries(BUDGETS.pages)) {
  test(`${path} loads within budget on a slow phone`, async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);

    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8
    });
    await page.setViewportSize({ width: 412, height: 823 });
    // Collected from the start, before the page's own scripts run
    await page.addInitScript(() => {
      const w = window as unknown as {
        __lcp: number;
        __cls: number;
        __tbt: number;
      };

      w.__lcp = 0;
      w.__cls = 0;
      w.__tbt = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) w.__lcp = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceEntry[] &
          { value: number; hadRecentInput: boolean }[]) {
          if (!entry.hadRecentInput) w.__cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          w.__tbt += Math.max(0, entry.duration - 50);
        }
      }).observe({ type: 'longtask', buffered: true });
    });

    await page.goto(path);
    await waitForApp(page);
    await page.waitForLoadState('networkidle');

    const metrics = await page.evaluate(() => {
      const w = window as unknown as {
        __lcp: number;
        __cls: number;
        __tbt: number;
      };
      const transfer = performance
        .getEntriesByType('resource')
        .concat(performance.getEntriesByType('navigation'))
        .reduce(
          (sum, entry) =>
            sum + (entry as PerformanceResourceTiming).decodedBodySize,
          0
        );

      return {
        transferKb: transfer / 1024,
        lcpMs: w.__lcp,
        cls: w.__cls,
        tbtMs: w.__tbt
      };
    });

    test.info().annotations.push({
      type: 'metrics',
      description: `transfer ${metrics.transferKb.toFixed(0)} kB, LCP ${metrics.lcpMs.toFixed(0)} ms, CLS ${metrics.cls.toFixed(3)}, TBT ${metrics.tbtMs.toFixed(0)} ms`
    });
    expect(metrics.transferKb, 'transfer, kB').toBeLessThanOrEqual(
      budget.transferKb
    );
    expect(metrics.lcpMs, 'LCP, ms').toBeGreaterThan(0);
    expect(metrics.lcpMs, 'LCP, ms').toBeLessThanOrEqual(budget.lcpMs);
    expect(metrics.cls, 'CLS').toBeLessThanOrEqual(budget.cls);
    expect(metrics.tbtMs, 'TBT, ms').toBeLessThanOrEqual(budget.tbtMs);
  });
}
