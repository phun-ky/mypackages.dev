// The numbers the user page shows for a portfolio, counted with the same
// module (_shared/downloads.ts), so the front page example matches the page
// it links to.
import {
  changePct,
  completeMonthTotals,
  type DailyDownloads,
  lastMonths,
  latestMonth,
  sumMonths,
} from "../_shared/downloads.ts";

export type PackageInput = {
  name: string;
  // Per day for the last 12 complete months, from api.npmjs.org/downloads/range
  daily: DailyDownloads[];
};

export type MonthTotal = { month: string; downloads: number };

export type TopPackage = {
  name: string;
  // Downloads in the latest complete month, the last of `months`
  monthly: number;
  change_pct: number | null;
};

export type Snapshot = {
  package_count: number;
  // Downloads in the latest complete month, the last of `months`
  monthly_downloads: number;
  change_pct: number | null;
  months: MonthTotal[];
  top_packages: TopPackage[];
};

/** Builds the snapshot for a portfolio. */
export const computeSnapshot = (
  packages: PackageInput[],
  { topCount = 3, monthCount = 12 } = {},
): Snapshot => {
  const perPackage = packages.map((pkg) => ({
    name: pkg.name,
    totals: completeMonthTotals(pkg.daily),
  }));
  const portfolio = sumMonths(perPackage.map((pkg) => pkg.totals));
  const latest = latestMonth(portfolio);
  const monthlyOf = (totals: Record<string, number>) =>
    latest ? totals[latest.month] ?? 0 : 0;
  const top_packages = perPackage
    .map((pkg) => ({ ...pkg, monthly: monthlyOf(pkg.totals) }))
    .sort((a, b) => b.monthly - a.monthly || a.name.localeCompare(b.name))
    .slice(0, topCount)
    .map((pkg) => ({
      name: pkg.name,
      monthly: pkg.monthly,
      change_pct: changePct(pkg.totals),
    }));

  return {
    package_count: packages.length,
    monthly_downloads: latest?.downloads ?? 0,
    change_pct: changePct(portfolio),
    months: lastMonths(portfolio, monthCount),
    top_packages,
  };
};
