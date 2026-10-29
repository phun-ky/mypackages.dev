// The days the download charts ask npm for (#93). npm's `last-year` is the
// last 365 days, so its oldest month is cut off; these start on the first day
// of a month instead, so the charts get 12 complete months.

export type DayRange = { start: string; end: string };

const DAY_MS = 24 * 60 * 60 * 1000;

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** The first day of the month `months` before the one `now` is in, in UTC. */
const monthStart = (now: Date, months: number) =>
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 1);

/**
 * From the first day of the month 12 months back to yesterday: 12 complete
 * months, and this month's days for the daily and weekly charts. npm counts
 * a day once it's over, so yesterday is the last one it can have.
 */
export const downloadRange = (now: Date, months = 12): DayRange => ({
  start: isoDay(monthStart(now, months)),
  end: isoDay(now.getTime() - DAY_MS),
});

/** The last `months` complete months, ending the day before this month. */
export const completeMonthsRange = (now: Date, months = 12): DayRange => ({
  start: isoDay(monthStart(now, months)),
  end: isoDay(monthStart(now, 0) - DAY_MS),
});

/** The days in a range, both ends included. */
export const daysIn = ({ start, end }: DayRange) =>
  Math.round((Date.parse(end) - Date.parse(start)) / DAY_MS) + 1;

/**
 * Splits a range into consecutive ranges of at most `maxDays` days, for
 * npm's bulk queries, which take 365 days at most: 12 months that include a
 * 29 February are 366.
 */
export const splitRange = (range: DayRange, maxDays: number): DayRange[] => {
  const parts: DayRange[] = [];
  const endMs = Date.parse(range.end);

  for (let ms = Date.parse(range.start); ms <= endMs; ms += maxDays * DAY_MS) {
    parts.push({
      start: isoDay(ms),
      end: isoDay(Math.min(ms + (maxDays - 1) * DAY_MS, endMs)),
    });
  }

  return parts;
};

/** The range as npm's downloads API takes it, like `2025-10-01:2026-09-30`. */
export const rangePath = ({ start, end }: DayRange) => `${start}:${end}`;
