// The numbers the user page shows for a portfolio, computed the same way
// (see MonthlyDownloadsBox and getUserDownloadsByMonth in src/), so the front
// page example matches the page it links to.

export type DailyDownloads = { day: string; downloads: number };

export type PackageInput = {
  name: string;
  // Rolling 30 days, from the npm search, as the user page totals them
  monthly: number;
  // Per day for the last 12 complete months, from api.npmjs.org/downloads/range
  daily: DailyDownloads[];
};

export type MonthTotal = { month: string; downloads: number };

export type TopPackage = {
  name: string;
  monthly: number;
  change_pct: number | null;
};

export type Snapshot = {
  package_count: number;
  monthly_downloads: number;
  change_pct: number | null;
  months: MonthTotal[];
  top_packages: TopPackage[];
};

const MONTH = /^\d{4}-\d{2}$/;

const daysInMonth = (month: string) => {
  const [year, m] = month.split("-").map(Number);

  return new Date(Date.UTC(year, m, 0)).getUTCDate();
};

/**
 * Sums daily downloads per calendar month, keeping only the months the data
 * has every day of (#93), and leaving out `currentMonth`, which isn't
 * complete yet.
 */
export const monthlyTotals = (
  daily: DailyDownloads[],
  currentMonth: string
): Record<string, number> => {
  if (!MONTH.test(currentMonth)) {
    throw new RangeError(`currentMonth must be YYYY-MM, got ${currentMonth}`);
  }

  const totals: Record<string, number> = Object.create(null);
  const days: Record<string, Set<string>> = Object.create(null);

  for (const { day, downloads } of daily) {
    const month = day.slice(0, 7);

    if (month === currentMonth || !MONTH.test(month)) continue;

    totals[month] = (totals[month] ?? 0) + downloads;
    (days[month] ??= new Set()).add(day);
  }

  for (const month of Object.keys(totals)) {
    if (days[month].size !== daysInMonth(month)) delete totals[month];
  }

  return totals;
};

/**
 * The change from the month before to the latest month, in percent. `null`
 * when there are fewer than two months, or the earlier one had no downloads
 * and the latest has some (the user page shows that as ∞%).
 */
export const changePct = (totals: Record<string, number>): number | null => {
  const months = Object.keys(totals).sort();

  if (months.length < 2) return null;

  const last = totals[months.at(-1)!];
  const previous = totals[months.at(-2)!];

  if (previous === 0) return last === 0 ? 0 : null;

  return ((last - previous) / previous) * 100;
};

/** Combines per-package monthly totals into one total per month. */
export const sumMonths = (
  perPackage: Record<string, number>[]
): Record<string, number> => {
  const sum: Record<string, number> = Object.create(null);

  for (const totals of perPackage) {
    for (const [month, downloads] of Object.entries(totals)) {
      sum[month] = (sum[month] ?? 0) + downloads;
    }
  }

  return sum;
};

/** Builds the snapshot for a portfolio, as of `now`. */
export const computeSnapshot = (
  packages: PackageInput[],
  now: Date,
  { topCount = 3, monthCount = 12 } = {}
): Snapshot => {
  const currentMonth = now.toISOString().slice(0, 7);
  const perPackage = packages.map((pkg) => ({
    ...pkg,
    totals: monthlyTotals(pkg.daily, currentMonth)
  }));
  const portfolio = sumMonths(perPackage.map((pkg) => pkg.totals));
  const months = Object.keys(portfolio)
    .sort()
    .slice(-monthCount)
    .map((month) => ({ month, downloads: portfolio[month] }));
  const top_packages = [...perPackage]
    .sort((a, b) => b.monthly - a.monthly || a.name.localeCompare(b.name))
    .slice(0, topCount)
    .map((pkg) => ({
      name: pkg.name,
      monthly: pkg.monthly,
      change_pct: changePct(pkg.totals)
    }));

  return {
    package_count: packages.length,
    monthly_downloads: packages.reduce((sum, pkg) => sum + pkg.monthly, 0),
    change_pct: changePct(portfolio),
    months,
    top_packages
  };
};
