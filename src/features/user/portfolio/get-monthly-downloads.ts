import { getLastYearDownloadsResult } from '../../../services/npm/get-last-year-downloads-result';
import { concurrentForEach } from '../../../utils/concurrent-for-each';

import type { MonthlyTotals } from './build-portfolio';

/**
 * Downloads per complete calendar month for each package, from the same
 * cached last-year downloads the rest of the site uses, so the page asks npm
 * for nothing extra. A package whose downloads can't be fetched is left out.
 */
export const getMonthlyDownloads = async (
  names: string[],
  signal: AbortSignal,
  now = new Date()
): Promise<Map<string, MonthlyTotals>> => {
  const currentMonth = now.toISOString().slice(0, 7);
  const result = new Map<string, MonthlyTotals>();

  await concurrentForEach(
    names,
    6,
    async (name) => {
      const res = await getLastYearDownloadsResult(name, signal);

      if (!res.ok) return;

      const totals: MonthlyTotals = {};

      for (const { day, downloads } of res.data.downloads ?? []) {
        const month = day.slice(0, 7);

        if (month !== currentMonth) {
          totals[month] = (totals[month] ?? 0) + downloads;
        }
      }

      result.set(name, totals);
    },
    { signal }
  );

  return result;
};
