import { DAY_MS } from '../../constants/temporal';
import { releaseStatusFromHealth } from '../../features/release-status';
import type { ReleaseHealth } from '../../types';
import { calcMoMChangePct } from '../../utils/calc-mom-change-pct';
import { clamp } from '../../utils/clamp';
import { scoreCadence } from '../../utils/score-cadence';
import { scoreRecency } from '../../utils/score-recency';

export type MaintenanceKey =
  | 'unknown'
  | 'deprecated'
  | 'fresh'
  | 'stable'
  | 'stale'
  | 'dormant';

export type MaintenanceLabel =
  | 'Unknown'
  | 'Deprecated'
  | 'Fresh'
  | 'Stable'
  | 'Stale'
  | 'Dormant';

export type MaintenanceResult = {
  key: MaintenanceKey;
  label: MaintenanceLabel;
  /** Tooltip / helper text */
  title: string;

  /** 0–100 score (for progress/ring) */
  scorePct: number;

  /**
   * Change vs previous period, e.g. 12.3 => +12.3%
   * Omit when not computable.
   */
  changePct?: number;

  /** Optional: debug / explainability for UI details */
  meta?: {
    ageDays?: number;
    cadenceSample?: number;
    cadenceDays?: number | string;
    deprecated?: string | boolean | null;
    downloadsMonthly?: number;
  };
};

export const packageMaintenance = (args: {
  releaseHealth?: ReleaseHealth;
  downloadsMonthlyTotal?: number; // your `details.downloads.monthly` (single number)
  downloadsMonthlyHistory?: Record<string, number>; // optional series
}): MaintenanceResult => {
  const { releaseHealth, downloadsMonthlyTotal, downloadsMonthlyHistory } =
    args;
  const preparedDownloadsIntervalsHistory = downloadsMonthlyHistory
    ? Object.entries(downloadsMonthlyHistory)
        .sort(([a], [b]) => a.localeCompare(b)) // chronological for "YYYY-MM"
        .map(([interval, downloads]) => ({ interval, downloads }))
    : [];
  const base = releaseStatusFromHealth(
    releaseHealth,
    downloadsMonthlyTotal
  ) as {
    key: MaintenanceKey;
    label: MaintenanceLabel;
    title: string;
  };

  // Unknown
  if (!releaseHealth) {
    return {
      ...base,
      scorePct: 50,
      changePct: calcMoMChangePct(preparedDownloadsIntervalsHistory)
    };
  }

  // Deprecated -> hard floor
  if (releaseHealth.deprecated) {
    return {
      ...base,
      scorePct: 5,
      changePct: calcMoMChangePct(preparedDownloadsIntervalsHistory)
    };
  }

  const ms = releaseHealth.lastPublishMs;

  if (!ms) {
    return {
      ...base,
      scorePct: 45,
      changePct: calcMoMChangePct(preparedDownloadsIntervalsHistory)
    };
  }

  const ageDays = Math.floor((Date.now() - ms) / DAY_MS);
  const r = scoreRecency(ageDays);
  const c = scoreCadence(releaseHealth.cadenceAvgMs);

  // Weighted blend: recency drives maintenance most
  let score = 0.65 * r + 0.35 * c;

  // Stable boost: older but heavily used (your logic)
  const isStableHeavyUse =
    ageDays > 180 &&
    downloadsMonthlyTotal != null &&
    downloadsMonthlyTotal >= 1000;

  if (isStableHeavyUse) score += 8;

  // Dormant penalty: very old publish
  if (ageDays > 365) score -= 10;

  score = clamp(Math.round(score), 0, 100);

  const cadenceDays =
    typeof releaseHealth?.cadenceAvgMs === 'number'
      ? Math.round(releaseHealth.cadenceAvgMs / DAY_MS)
      : '-';

  return {
    ...base,
    scorePct: score,
    changePct: calcMoMChangePct(preparedDownloadsIntervalsHistory),
    meta: {
      cadenceDays,
      cadenceSample: releaseHealth.cadenceSample,
      ageDays,
      deprecated: releaseHealth.deprecated,
      downloadsMonthly: downloadsMonthlyTotal
    }
  };
};
