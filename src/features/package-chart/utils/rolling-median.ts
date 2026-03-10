export const rollingMedian = (
  points: [number, number][],
  window = 3
): [number, number][] => {
  const half = Math.floor(window / 2);
  const median = (arr: number[]) => {
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);

    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };

  return points.map(([ts], i) => {
    const start = Math.max(0, i - half);
    const end = Math.min(points.length, i + half + 1);
    const ys = points.slice(start, end).map((p) => p[1]);

    return [ts, median(ys)];
  });
};
