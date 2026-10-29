import { completeMonthTotals } from '../../utils/complete-month-totals';

export type IntervalDataItem<TInterval extends string | number = string> = {
  intervalRecord: Record<string, number>;
  intervals: TInterval[];
  series: [number, number][];
};

export type IntervalRecords = {
  weekly: IntervalDataItem<number>;
  monthly: IntervalDataItem<string>;
};

export const getDataForChart = (
  data: {
    day: string;
    downloads: number;
  }[]
): IntervalRecords => {
  const intervalRecords: IntervalRecords = {
    monthly: { intervalRecord: {}, intervals: [], series: [] },
    weekly: { intervalRecord: {}, intervals: [], series: [] }
  };
  const intervalRecordMonth = completeMonthTotals(data);
  const intervalsMonth = Object.keys(intervalRecordMonth).sort();
  const seriesMonth: [number, number][] = intervalsMonth.map((m) => {
    const [y, mth] = m.split('-').map(Number);

    return [Date.UTC(y, mth - 1, 1), intervalRecordMonth[m]];
  });

  intervalRecords.monthly = {
    intervalRecord: intervalRecordMonth,
    intervals: intervalsMonth,
    series: seriesMonth
  };

  const intervalRecordWeekly: Record<string, number> = {};

  for (const { day, downloads } of data) {
    const d = new Date(`${day}T00:00:00.000Z`);
    const dayOfWeek = d.getUTCDay();
    const diffToMonday = (dayOfWeek + 6) % 7; // 0 if Mon

    d.setUTCDate(d.getUTCDate() - diffToMonday);
    d.setUTCHours(0, 0, 0, 0);

    const weekStartUtc = d.getTime();
    const key = String(weekStartUtc);

    intervalRecordWeekly[key] = (intervalRecordWeekly[key] || 0) + downloads;
  }

  const intervalsWeekly = Object.keys(intervalRecordWeekly)
    .sort((a, b) => Number(a) - Number(b))
    .map(Number);
  const seriesWeekly: [number, number][] = intervalsWeekly.map((t) => [
    t,
    intervalRecordWeekly[String(t)]
  ]);

  intervalRecords.weekly = {
    intervalRecord: intervalRecordWeekly,
    intervals: intervalsWeekly,
    series: seriesWeekly
  };

  return intervalRecords;
};
