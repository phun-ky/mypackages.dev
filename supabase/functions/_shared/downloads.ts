// How the site and portfolio-snapshot count npm downloads (#94), in one
// place so the front page example and the pages can't drift apart. Pure and
// without imports, so the site bundles it as it is.

export type DailyDownloads = { day: string; downloads: number };

/** Downloads per calendar month, like `{ "2026-09": 1234 }` */
export type MonthlyTotals = Record<string, number>;

export type DownloadSummary = {
  /** Every complete month in the data */
  totals: MonthlyTotals;
  /** Downloads after the last complete month: this month so far */
  sinceLastMonth: number;
  /** The last day in the data, like `2026-10-28`; npm lags a day or two */
  end: string | null;
};

const MONTH = /^\d{4}-\d{2}$/;

const daysInMonth = (month: string) => {
  const [year, m] = month.split("-").map(Number);

  return new Date(Date.UTC(year, m, 0)).getUTCDate();
};

/**
 * Sums daily downloads per calendar month, keeping only the months the data
 * has every day of (#93), so a chart never starts or ends with a month that
 * looks like a drop. npm's data ends yesterday at the latest, so the current
 * month is never complete.
 */
export const completeMonthTotals = (daily: DailyDownloads[]): MonthlyTotals => {
  // No prototype: a key like `constructor` can't come from anywhere else
  const totals: MonthlyTotals = Object.create(null);
  const days: Record<string, Set<string>> = Object.create(null);

  for (const { day, downloads } of daily) {
    const month = day.slice(0, 7);

    if (!MONTH.test(month)) continue;

    totals[month] = (totals[month] ?? 0) + downloads;
    (days[month] ??= new Set()).add(day);
  }

  for (const month of Object.keys(totals)) {
    if (days[month].size !== daysInMonth(month)) delete totals[month];
  }

  return totals;
};

/** The complete months, what came after them, and the last day. */
export const summarizeDownloads = (daily: DailyDownloads[]): DownloadSummary => {
  const totals = completeMonthTotals(daily);
  const last = latestMonth(totals)?.month ?? "";
  let sinceLastMonth = 0;
  let end: string | null = null;

  for (const { day, downloads } of daily) {
    if (day.slice(0, 7) > last) sinceLastMonth += downloads;

    if (end === null || day > end) end = day;
  }

  return { totals, sinceLastMonth, end };
};

/** The latest month and its downloads, or `null` when there are none. */
export const latestMonth = (
  totals: MonthlyTotals,
): { month: string; downloads: number } | null => {
  const month = Object.keys(totals).sort().at(-1);

  return month === undefined ? null : { month, downloads: totals[month] };
};

/** The last `count` months, oldest first. */
export const lastMonths = (totals: MonthlyTotals, count = 12) =>
  Object.keys(totals)
    .sort()
    .slice(-count)
    .map((month) => ({ month, downloads: totals[month] }));

/**
 * The change from the month before to the latest month, in percent. `null`
 * with fewer than two months, or from zero to more than zero.
 */
export const changePct = (totals: MonthlyTotals): number | null => {
  const months = Object.keys(totals).sort();

  if (months.length < 2) return null;

  const last = totals[months[months.length - 1]];
  const previous = totals[months[months.length - 2]];

  if (previous === 0) return last === 0 ? 0 : null;

  return ((last - previous) / previous) * 100;
};

/** Combines per-package monthly totals into one total per month. */
export const sumMonths = (perPackage: Iterable<MonthlyTotals>): MonthlyTotals => {
  const sum: MonthlyTotals = Object.create(null);

  for (const totals of perPackage) {
    for (const [month, downloads] of Object.entries(totals)) {
      sum[month] = (sum[month] ?? 0) + downloads;
    }
  }

  return sum;
};
