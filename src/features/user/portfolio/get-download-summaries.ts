import { getLastYearDownloadsResult } from '../../../services/npm/get-last-year-downloads-result';
import { concurrentForEach } from '../../../utils/concurrent-for-each';
import {
  type DownloadSummary,
  summarizeDownloads
} from '../../../utils/downloads';

/**
 * Each package's complete months, this month so far and the day the data
 * runs to, from the same cached downloads the rest of the site uses, so the
 * page asks npm for nothing extra. A package whose downloads can't be
 * fetched is left out.
 */
export const getDownloadSummaries = async (
  names: string[],
  signal: AbortSignal
): Promise<Map<string, DownloadSummary>> => {
  const result = new Map<string, DownloadSummary>();

  await concurrentForEach(
    names,
    6,
    async (name) => {
      const res = await getLastYearDownloadsResult(name, signal);

      if (!res.ok) return;

      result.set(name, summarizeDownloads(res.data.downloads ?? []));
    },
    { signal }
  );

  return result;
};
