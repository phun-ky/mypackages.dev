import { YEAR_MS } from '../../../constants/temporal';
import type { FetchUserPackagesUnionItem } from '../../../types';
import {
  changePct,
  type DownloadSummary,
  lastMonths,
  latestMonth,
  sumMonths
} from '../../../utils/downloads';

export type PortfolioPackage = {
  name: string;
  description: string;
  version: string | null;
  keywords: string[];
  /**
   * Downloads in the portfolio's latest complete month, the last of
   * `series`. npm's search figure, a rolling 30 days, only when the package's
   * downloads couldn't be fetched
   */
  monthly: number;
  /** From the month before to the latest complete month, in percent */
  change: number | null;
  /** The last 12 complete months, oldest first */
  series: number[];
  scope: string;
  lastPublishMs: number | null;
  releasesLastYear: number;
  types: boolean;
  deprecated: boolean;
  /** No release in the last year */
  dormant: boolean;
};

export type Portfolio = {
  packages: PortfolioPackage[];
  /** The latest complete month, like `2026-09`, that `monthly` counts */
  month: string | null;
  /** The last day npm's data has, like `2026-10-28` */
  dataEnd: string | null;
  monthly: number;
  change: number | null;
  months: { month: string; downloads: number }[];
  share: { name: string; monthly: number }[];
  attention: { pkg: PortfolioPackage; reason: 'dormant' | 'falling' }[];
  doingWell: PortfolioPackage[];
  dormant: PortfolioPackage[];
  scopes: { scope: string; monthly: number; packages: PortfolioPackage[] }[];
  topics: { keyword: string; count: number }[];
};

export const UNSCOPED = 'Unscoped';

// A package is "falling fast" below this change, and only worth attention
// when dormant if it's still used this much
const FALLING_PCT = -70;
const STILL_USED = 1000;
const scopeOf = (name: string) =>
  name.startsWith('@') ? name.slice(0, name.indexOf('/')) : UNSCOPED;

/**
 * Everything the user page shows, from the packages and their downloads per
 * month. Pure, so the rules are in one place.
 */
export const buildPortfolio = (
  items: FetchUserPackagesUnionItem[],
  summaries: Map<string, DownloadSummary>,
  now = Date.now(),
  { monthCount = 12, topCount = 4, listCount = 4, topicCount = 16 } = {}
): Portfolio => {
  const total = sumMonths([...summaries.values()].map((s) => s.totals));
  const month = latestMonth(total)?.month ?? null;
  const dataEnd =
    [...summaries.values()]
      .map((s) => s.end)
      .filter((end) => end !== null)
      .sort()
      .at(-1) ?? null;
  const packages: PortfolioPackage[] = items.map((item) => {
    const { package: pkg, downloads } = item;
    const summary = summaries.get(pkg.name);
    const totals = summary?.totals ?? {};
    const health = pkg.releaseHealth;
    const lastPublishMs = health?.lastPublishMs ?? null;

    return {
      name: pkg.name,
      description: typeof pkg.description === 'string' ? pkg.description : '',
      version:
        health?.latestVersion ??
        (typeof pkg.version === 'string' ? pkg.version : null),
      keywords: Array.isArray(pkg.keywords) ? pkg.keywords : [],
      monthly: summary ? (month ? (totals[month] ?? 0) : 0) : downloads.monthly,
      // No downloads in any complete month, but some since: published this
      // month, so there's nothing to compare with yet
      change:
        summary &&
        summary.sinceLastMonth > 0 &&
        Object.values(totals).every((n) => n === 0)
          ? null
          : changePct(totals),
      series: lastMonths(totals, monthCount).map((m) => m.downloads),
      scope: scopeOf(pkg.name),
      lastPublishMs,
      releasesLastYear: health?.releasesLastYear ?? 0,
      types: health?.hasTypes ?? false,
      deprecated: health?.deprecated ?? false,
      dormant: lastPublishMs === null || now - lastPublishMs > YEAR_MS
    };
  });

  packages.sort(
    (a, b) => b.monthly - a.monthly || a.name.localeCompare(b.name)
  );

  const monthly = packages.reduce((sum, pkg) => sum + pkg.monthly, 0);
  const top = packages.slice(0, topCount);
  const others = packages.slice(topCount);
  const share = top.map(({ name, monthly }) => ({ name, monthly }));

  if (others.length) {
    share.push({
      name: `${others.length} others`,
      monthly: others.reduce((sum, pkg) => sum + pkg.monthly, 0)
    });
  }

  const dormant = packages.filter((pkg) => pkg.dormant);
  const attention = [
    ...dormant
      .filter((pkg) => pkg.monthly >= STILL_USED)
      .map((pkg) => ({ pkg, reason: 'dormant' as const })),
    ...packages
      .filter((pkg) => !pkg.dormant && (pkg.change ?? 0) <= FALLING_PCT)
      .sort((a, b) => (a.change ?? 0) - (b.change ?? 0))
      .map((pkg) => ({ pkg, reason: 'falling' as const }))
  ].slice(0, listCount);
  const doingWell = packages
    .filter((pkg) => (pkg.change ?? 0) > 0)
    .sort((a, b) => (b.change ?? 0) - (a.change ?? 0))
    .slice(0, listCount);
  const scopes = [...new Set(packages.map((pkg) => pkg.scope))]
    .map((scope) => {
      const inScope = packages.filter((pkg) => pkg.scope === scope);

      return {
        scope,
        packages: inScope,
        monthly: inScope.reduce((sum, pkg) => sum + pkg.monthly, 0)
      };
    })
    .sort((a, b) => b.monthly - a.monthly);
  const counts = new Map<string, number>();

  for (const pkg of packages) {
    for (const keyword of new Set(pkg.keywords.map((k) => k.toLowerCase()))) {
      counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
    }
  }

  return {
    packages,
    month,
    dataEnd,
    monthly,
    change: changePct(total),
    months: lastMonths(total, monthCount),
    share,
    attention,
    doingWell,
    dormant,
    scopes,
    topics: [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, topicCount)
      .map(([keyword, count]) => ({ keyword, count }))
  };
};
