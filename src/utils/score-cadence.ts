import { DAY_MS } from '../constants/temporal';

export const scoreCadence = (cadenceAvgMs?: number | null) => {
  if (
    !cadenceAvgMs ||
    cadenceAvgMs === null ||
    typeof cadenceAvgMs !== 'number'
  )
    return 50; // neutral if unknown

  const cadenceDays = cadenceAvgMs / DAY_MS;

  // These breakpoints are conservative.
  if (cadenceDays <= 7) return 95;

  if (cadenceDays <= 14) return 90;

  if (cadenceDays <= 30) return 80;

  if (cadenceDays <= 60) return 65;

  if (cadenceDays <= 120) return 50;

  return 35;
};
