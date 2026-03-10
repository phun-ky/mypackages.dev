import {
  DOWNLOAD_COUNT_THRESHOLD,
  DOWNLOAD_COUNT_UPPER_THRESHOLD
} from '../../constants/thresholds';
import { clamp } from '../../utils/clamp';

export type Popularity = 'low' | 'relative-low' | 'decent';

export type PopularityKey = Popularity;

export type PopularityResult = {
  key: PopularityKey;
  title: string;
  label: Popularity;
  /** 0–100 normalized “how popular” score */
  scorePct: number;
  /**
   * Percentage change vs previous period, e.g. 12.3 means +12.3%.
   * Undefined if previousDownloads not provided.
   */
  changePct?: number;
};

const cap = DOWNLOAD_COUNT_UPPER_THRESHOLD * 50; // tweak as you like
const log = (x: number) => Math.log10(Math.max(1, x));

/**
 * Maps downloads into a 0–100 score.
 * - 0..threshold => 0..33
 * - threshold..upper => 33..66
 * - upper..infinity => 66..100 (asymptotically, via log scaling)
 */
export const packagePopularity = (
  downloads: number,
  previousDownloads?: number
): PopularityResult => {
  const d = Math.max(0, downloads);

  let label: Popularity;
  let title: string;

  if (d < DOWNLOAD_COUNT_THRESHOLD) label = 'low';
  else if (d < DOWNLOAD_COUNT_UPPER_THRESHOLD) label = 'relative-low';
  else label = 'decent';

  // scorePct
  let scorePct: number;

  if (d < DOWNLOAD_COUNT_THRESHOLD) {
    // linear 0..33
    scorePct =
      (DOWNLOAD_COUNT_THRESHOLD as number) === 0
        ? 0
        : (d / DOWNLOAD_COUNT_THRESHOLD) * 33;
    title = `Below ${DOWNLOAD_COUNT_THRESHOLD} monthly downloads`;
  } else if (d < DOWNLOAD_COUNT_UPPER_THRESHOLD) {
    // linear 33..66
    const span = DOWNLOAD_COUNT_UPPER_THRESHOLD - DOWNLOAD_COUNT_THRESHOLD || 1;

    scorePct = 33 + ((d - DOWNLOAD_COUNT_THRESHOLD) / span) * 33;
    title = `Between ${DOWNLOAD_COUNT_THRESHOLD} and ${DOWNLOAD_COUNT_UPPER_THRESHOLD} monthly downloads`;
  } else {
    // 66..100 using log scaling so huge numbers don’t instantly pin at 100
    // Choose a “cap” where you want it to feel ~near-max.

    const denom = log(cap) - log(DOWNLOAD_COUNT_UPPER_THRESHOLD);
    const t =
      denom <= 0 ? 1 : (log(d) - log(DOWNLOAD_COUNT_UPPER_THRESHOLD)) / denom;

    scorePct = 66 + clamp(t, 0, 1) * 34;
    title = `Above ${DOWNLOAD_COUNT_UPPER_THRESHOLD} monthly downloads`;
  }

  scorePct = clamp(Math.round(scorePct * 10) / 10, 0, 100);

  // changePct
  let changePct: number | undefined;

  if (previousDownloads !== undefined) {
    const prev = Math.max(0, previousDownloads);

    // If prev is 0, define change in a stable way (avoid Infinity)
    changePct = prev === 0 ? (d === 0 ? 0 : 100) : ((d - prev) / prev) * 100;

    changePct = Math.round(changePct * 10) / 10;
  }

  return { key: label, title, label, scorePct, changePct };
};
