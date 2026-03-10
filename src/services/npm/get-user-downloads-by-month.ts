import type { Config } from '../../types';
import { uniqueStrings } from '../../utils';
import { concurrentForEach } from '../../utils/concurrent-for-each';
import { supabase } from '../supabase';

import { getLastYearDownloadsResult } from './get-last-year-downloads-result';
import { searchPackagesByUserRole } from './search-packages-by-user-role';
import { getTrackedPackages, mergeIntoTracked } from './tracked';

export const getUserDownloadsByMonth = async (
  username: string,
  options: Config,
  signal: AbortSignal
) => {
  const { maintainer } = options;
  const role = maintainer ? 'maintainer' : 'author';
  const searchData = await searchPackagesByUserRole(
    supabase,
    username,
    options,
    signal
  );
  const fromSearch = (searchData.objects || [])
    .map((o) => o.package?.name)
    .filter(Boolean);

  mergeIntoTracked(fromSearch, username, role, signal);

  const tracked = await getTrackedPackages(username, role, signal);
  const allNames = uniqueStrings([...fromSearch, ...tracked]);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const perPackageMonthly = new Map<string, Record<string, number>>();

  await concurrentForEach(
    allNames,
    6,
    async (name) => {
      const res = await getLastYearDownloadsResult(name, signal);

      if (res.ok) {
        const { data } = res;
        const { downloads } = data;
        const local: Record<string, number> = {};

        for (const { day, downloads: d } of downloads || []) {
          const month = day.slice(0, 7);

          if (month === currentMonth) continue;

          local[month] = (local[month] || 0) + d;
        }

        perPackageMonthly.set(name, local);
      }
    },
    { signal }
  );

  const downloadsPerMonth: Record<string, number> = {};

  for (const local of perPackageMonthly.values()) {
    for (const [month, sum] of Object.entries(local)) {
      downloadsPerMonth[month] = (downloadsPerMonth[month] || 0) + sum;
    }
  }

  return downloadsPerMonth;
};
