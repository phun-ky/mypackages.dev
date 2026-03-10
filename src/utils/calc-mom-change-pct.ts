export type IntervalPoint = { interval: string; downloads: number }; // adapt to your actual shape

export const calcMoMChangePct = (intervals?: IntervalPoint[]) => {
  if (!intervals || intervals.length < 2) return undefined;

  const last = intervals[intervals.length - 1]?.downloads ?? 0;
  const prev = intervals[intervals.length - 2]?.downloads ?? 0;

  if (prev === 0) return last === 0 ? 0 : 100;

  const pct = ((last - prev) / prev) * 100;

  return Math.round(pct * 10) / 10;
};
