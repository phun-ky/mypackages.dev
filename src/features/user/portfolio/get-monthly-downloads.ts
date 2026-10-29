import { getLastYearDownloadsResult } from '../../../services/npm/get-last-year-downloads-result';
import {
  completeMonthTotals,
  type MonthlyTotals
} from '../../../utils/complete-month-totals';
import { concurrentForEach } from '../../../utils/concurrent-for-each';

/**
 * Downloads per complete calendar month for each package, from the same
 * cached last-year downloads the rest of the site uses, so the page asks npm
 * for nothing extra. A package whose downloads can't be fetched is left out.
 */
export const getMonthlyDownloads = async (
  names: string[],
  signal: AbortSignal
): Promise<Map<string, MonthlyTotals>> => {
  const result = new Map<string, MonthlyTotals>();

  await concurrentForEach(
    names,
    6,
    async (name) => {
      const res = await getLastYearDownloadsResult(name, signal);

      if (!res.ok) return;

      result.set(name, completeMonthTotals(res.data.downloads ?? []));
    },
    { signal }
  );

  return result;
};
