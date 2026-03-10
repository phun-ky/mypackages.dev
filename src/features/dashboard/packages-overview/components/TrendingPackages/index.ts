/* eslint-disable import/no-unused-modules */
import { Package } from '../../../../../components/content/Package';
import type { ComponentBasePropsType } from '../../../../../lib/spa/types';
import type { Config, FetchUserPackagesUnionItem } from '../../../../../types';

import { getDataForChart } from '/features/package/get-data-for-chart';
import { getLastYearDownloadsResult } from '/services/npm/get-last-year-downloads-result';
import './styles/trendingPackages.css';

const html = String.raw;

export type TrendingPackagesPropsType = ComponentBasePropsType & {
  packages: FetchUserPackagesUnionItem[];
  options: Config;
};

type TrendingPkg = FetchUserPackagesUnionItem & {
  momPct: number | null; // numeric for sorting
  formattedMoM: string; // string for display
};

const formatMoM = (momPct: number | null) => {
  if (momPct === null) return 'N/A';

  if (momPct === Infinity) return '∞%';

  // keep sign (+/-) naturally
  return `${momPct.toFixed(1)}%`;
};
const toSortable = (momPct: number | null) => {
  // Put nulls last
  if (momPct === null) return Number.NEGATIVE_INFINITY;

  return momPct;
};

export const TrendingPackages = async (
  props: TrendingPackagesPropsType,
  signal: AbortSignal
) => {
  const { packages, options } = props;
  // 1) Fetch + compute for all packages
  const enriched: TrendingPkg[] = await Promise.all(
    packages.map(async (pkg) => {
      const name = pkg.package.name;
      const res = await getLastYearDownloadsResult(name, signal);

      if (!res.ok) {
        return { ...pkg, momPct: null, formattedMoM: 'N/A' };
      }

      const { data } = res;
      const { monthly } = getDataForChart(data.downloads);
      const { intervalRecord, intervals } = monthly;
      // Latest complete month and the one before it
      const lastMonth = intervals.at(-1);
      const prevMonth = intervals.at(-2);
      const lastMonthDownloads = lastMonth
        ? intervalRecord[lastMonth]
        : undefined;
      const prevMonthDownloads = prevMonth
        ? intervalRecord[prevMonth]
        : undefined;

      let momPct: number | null = null;

      if (
        typeof lastMonthDownloads === 'number' &&
        typeof prevMonthDownloads === 'number'
      ) {
        if (prevMonthDownloads === 0) {
          momPct = lastMonthDownloads === 0 ? 0 : Infinity;
        } else {
          momPct =
            ((lastMonthDownloads - prevMonthDownloads) / prevMonthDownloads) *
            100;
        }
      }

      return { ...pkg, momPct, formattedMoM: formatMoM(momPct) };
    })
  );
  // 2) Sort by MoM descending (Infinity on top, nulls at bottom)
  const trendingTop = enriched
    .slice() // don’t mutate original
    .sort((a, b) => toSortable(b.momPct) - toSortable(a.momPct))
    .slice(0, 4);
  // 3) Render
  const items = await Promise.all(
    trendingTop.map((pkg, index) =>
      Package({ type: 'trending', pkg, index, options }, signal)
    )
  );

  return html`<div class="trending-packages">
    <span class="title h3">Trending packages</span>
    ${items.join('\n')}
  </div>`;
};
