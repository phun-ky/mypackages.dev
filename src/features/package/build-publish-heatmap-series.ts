type PackumentTime = Record<string, string>;

export type HeatmapPoint = [number, number, number]; // [xWeekIndex, yDayOfWeekIndex, count]

export const buildPublishHeatmapSeries = (
  time: PackumentTime,
  opts?: { days?: number; endDate?: Date }
): {
  series: HeatmapPoint[];
  xCategories: string[]; // week labels
  yCategories: string[]; // Mon..Sun
  totalDays: number;
} => {
  const days = opts?.days ?? 365;
  const end = opts?.endDate ?? new Date();
  // Normalize end to UTC midnight
  const endUtc = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  );
  const startUtc = new Date(endUtc);

  startUtc.setUTCDate(startUtc.getUTCDate() - (days - 1)); // inclusive range

  const startMs = startUtc.getTime();
  const endMs = endUtc.getTime();
  // Count publishes per UTC day (key = dayStartMs)
  const perDay: Record<number, number> = {};

  for (const [ver, iso] of Object.entries(time ?? {})) {
    if (ver === 'created' || ver === 'modified') continue;

    const ms = Date.parse(iso);

    if (!Number.isFinite(ms)) continue;

    // Clamp into last-year window (by day)
    const d = new Date(ms);
    const dayStart = Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate()
    );

    if (dayStart < startMs || dayStart > endMs) continue;

    perDay[dayStart] = (perDay[dayStart] ?? 0) + 1;
  }

  // Align the grid to Monday start (like GitHub)
  // Find Monday on/before startUtc
  const gridStart = new Date(startUtc);
  const dow = gridStart.getUTCDay(); // Sun=0..Sat=6
  const diffToMonday = (dow + 6) % 7; // Mon =>0, Sun=>6

  gridStart.setUTCDate(gridStart.getUTCDate() - diffToMonday);
  gridStart.setUTCHours(0, 0, 0, 0);

  // Number of weeks in grid to cover through endUtc
  const gridDays = Math.ceil(
    (endMs - gridStart.getTime() + 1) / (24 * 60 * 60 * 1000)
  );
  const weekCount = Math.ceil(gridDays / 7);
  // Build heatmap points: x=week index, y=day index (Mon..Sun), value=count
  const points: HeatmapPoint[] = [];

  for (let w = 0; w < weekCount; w++) {
    for (let y = 0; y < 7; y++) {
      const day = new Date(gridStart);

      day.setUTCDate(gridStart.getUTCDate() + w * 7 + y);

      const dayStart = day.getTime();

      // Outside requested [startUtc..endUtc] should be "null-ish" (render as empty)
      if (dayStart < startMs || dayStart > endMs) {
        points.push([w, y, 0]);
        continue;
      }

      const v = perDay[dayStart] ?? 0;

      points.push([w, y, v]);
    }
  }

  const yCategories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Optional week labels (sparse to avoid clutter)
  // Label by month on the first week that contains a 1st-of-month day within range.
  const xCategories: string[] = Array.from({ length: weekCount }, () => '');

  for (let w = 0; w < weekCount; w++) {
    for (let y = 0; y < 7; y++) {
      const day = new Date(gridStart);

      day.setUTCDate(gridStart.getUTCDate() + w * 7 + y);

      const dayStart = day.getTime();

      if (dayStart < startMs || dayStart > endMs) continue;

      if (day.getUTCDate() === 1) {
        xCategories[w] = day.toLocaleString(undefined, { month: 'short' });
        break;
      }
    }
  }

  return { series: points, xCategories, yCategories, totalDays: days };
};
