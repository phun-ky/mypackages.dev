/** Downloads per calendar month, like `{ '2026-09': 1234 }` */
export type MonthlyTotals = Record<string, number>;

const daysInMonth = (month: string) => {
  const [year, m] = month.split('-').map(Number);

  return new Date(Date.UTC(year, m, 0)).getUTCDate();
};

/**
 * Sums daily downloads per calendar month, keeping only the months the data
 * has every day of (#93), so a chart never starts or ends with a month that
 * looks like a drop. npm's data ends yesterday, so the current month is
 * never complete.
 */
export const completeMonthTotals = (
  daily: { day: string; downloads: number }[]
): MonthlyTotals => {
  const totals: MonthlyTotals = {};
  const days = new Map<string, Set<string>>();

  for (const { day, downloads } of daily) {
    const month = day.slice(0, 7);

    totals[month] = (totals[month] ?? 0) + downloads;

    if (!days.has(month)) days.set(month, new Set());

    days.get(month)!.add(day);
  }

  for (const month of Object.keys(totals)) {
    if (days.get(month)!.size !== daysInMonth(month)) delete totals[month];
  }

  return totals;
};
