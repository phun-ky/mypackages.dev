export const getDownloadsDataPerMonth = (
  intervals: string[],
  intervalRecord: Record<string, number>
) => {
  let highestIntervall: string | number | null = null;
  let highest = 0;
  let average = 0;

  if (intervals.length > 0) {
    let sum = 0;

    for (const m of intervals) {
      const v = intervalRecord[m] ?? 0;

      sum += v;

      if (highestIntervall === null || v > highest) {
        highestIntervall = m; // "YYYY-MM"
        highest = v; // number
      }
    }

    average = sum / intervals.length;
  }

  return {
    average,
    highest
  };
};
