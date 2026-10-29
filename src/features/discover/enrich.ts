import { getPackageDetailsResult } from '../../services/npm/get-package-details-result';
import { searchPackagesByUserRole } from '../../services/npm/search-packages-by-user-role';
import { supabase } from '../../services/supabase';
import type { Config } from '../../types';
import { concurrentForEach } from '../../utils/concurrent-for-each';
import { lastMonths } from '../../utils/downloads';
import { getDownloadSummaries } from '../user/portfolio/get-download-summaries';

export type PackageInfo = {
  name: string;
  description: string;
  version: string;
  // Downloads in the last complete month, `month`, and in the 12 up to it
  month: string | null;
  monthly: number;
  series: number[];
};

export type UserInfo = {
  name: string;
  packages: number;
  // From npm's search: a rolling 30 days. The downloads API would take a
  // request per package, for every user shown
  monthly: number;
  top: string[];
};

/**
 * npm's details and monthly downloads for each package, from the same
 * cached calls as the package page. A package npm doesn't answer for is
 * left out.
 */
export const getPackageInfo = async (
  names: string[],
  signal: AbortSignal
): Promise<Map<string, PackageInfo>> => {
  const info = new Map<string, PackageInfo>();
  const summaries = await getDownloadSummaries(names, signal);

  await concurrentForEach(
    names,
    6,
    async (name) => {
      const res = await getPackageDetailsResult(name, signal);

      if (!res.ok) return;

      const months = lastMonths(summaries.get(name)?.totals ?? {});

      info.set(name, {
        name,
        description: res.data.description ?? '',
        version: res.data['dist-tags']?.latest ?? '',
        month: months.at(-1)?.month ?? null,
        monthly: months.at(-1)?.downloads ?? 0,
        series: months.map((m) => m.downloads)
      });
    },
    { signal }
  );

  return info;
};

/**
 * What each user maintains on npm: one search per user, as on the user
 * page, so it's cached for when the visitor opens it.
 */
export const getUserInfo = async (
  names: string[],
  options: Config,
  signal: AbortSignal
): Promise<Map<string, UserInfo>> => {
  const info = new Map<string, UserInfo>();

  await concurrentForEach(
    names,
    6,
    async (name) => {
      try {
        const res = await searchPackagesByUserRole(
          supabase,
          name,
          options,
          signal
        );

        // Nothing found reads better as no numbers than as zeros
        if (!res.total) return;

        const byDownloads = [...res.objects].sort(
          (a, b) => (b.downloads?.monthly ?? 0) - (a.downloads?.monthly ?? 0)
        );

        info.set(name, {
          name,
          packages: res.total,
          monthly: byDownloads.reduce(
            (sum, item) => sum + (item.downloads?.monthly ?? 0),
            0
          ),
          top: byDownloads.slice(0, 3).map((item) => item.package.name)
        });
      } catch {
        // Shown without npm's numbers
      }
    },
    { signal }
  );

  return info;
};
