import { DAY_MS, YEAR_MS } from '../../constants/temporal';
import type { MaintenanceResult } from '../../services/package/maintenance';
import type { PopularityResult } from '../../services/package/popularity';
import type { ProvenanceResult } from '../../services/package/provenance';
import type { QualityResult } from '../../services/package/quality';
import type { SecurityResult } from '../../services/package/security';
import { completeMonthTotals } from '../../utils/complete-month-totals';

// The words on the package report card (#61): a verdict, and the reason for
// each signal, from the same results that make up the health score. Pure, so
// the rules are in one place.

export type Signals = {
  security?: SecurityResult;
  maintenance?: MaintenanceResult;
  quality?: QualityResult;
  provenance?: ProvenanceResult;
  popularity?: PopularityResult;
};

export type SignalRow = { name: string; scorePct: number; reason: string };

const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});
const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export const ago = (ms: number, now = Date.now()) => {
  const days = Math.round((now - ms) / DAY_MS);

  if (days < 31) return relative.format(-days, 'day');

  if (days < 365) return relative.format(-Math.round(days / 30), 'month');

  return relative.format(-Math.round(days / 365), 'year');
};

/** "a, b and c" */
const and = (items: string[]) =>
  items.length < 2
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
const vulnCount = (security?: SecurityResult) =>
  security?.meta?.vulns?.length ?? 0;

export const securityReason = (security: SecurityResult, version: string) => {
  if (security.key === 'unknown') return "Couldn't check OSV for advisories";

  const n = vulnCount(security);

  return n === 0
    ? `No known vulnerabilities in OSV for ${version}`
    : `${n} known ${n === 1 ? 'vulnerability' : 'vulnerabilities'} in OSV for ${version}`;
};

export const maintenanceReason = (
  maintenance: MaintenanceResult,
  lastPublishMs: number | null,
  now = Date.now()
) => {
  if (maintenance.key === 'deprecated') return 'Deprecated by its maintainers';

  if (lastPublishMs === null) return 'No release date found';

  const cadence = maintenance.meta?.cadenceDays;
  const released = `Released ${ago(lastPublishMs, now)}`;

  return typeof cadence === 'number' && cadence > 0
    ? `${released}, about every ${cadence} days`
    : released;
};

export const qualityReason = (quality: QualityResult) => {
  const meta = quality.meta ?? {};
  const has = [
    meta.hasTypes && 'types',
    meta.hasTests && 'tests',
    meta.hasLicense && 'a license',
    meta.hasRepo && 'a repository',
    (meta.readmeChars ?? 0) > 200 && 'a README',
    meta.hasEnginesNode && 'engines'
  ].filter((x): x is string => Boolean(x));
  const missing = [
    !meta.hasTypes && 'types',
    !meta.hasTests && 'tests',
    !meta.hasLicense && 'license'
  ].filter((x): x is string => Boolean(x));

  if (!has.length) return quality.title;

  const sentence = `Has ${and(has)}`;

  return missing.length ? `${sentence}; no ${and(missing)} found` : sentence;
};

export const provenanceReason = (provenance: ProvenanceResult) => {
  const { reasons } = provenance;

  if (reasons.includes('attestations-present')) {
    return 'Published with npm provenance attestations';
  }

  if (reasons.includes('signatures-present')) {
    return 'Signed by the registry, without provenance attestations';
  }

  return provenance.title;
};

export const signalRows = (
  signals: Signals,
  {
    version,
    lastPublishMs,
    lastMonthDownloads,
    now = Date.now()
  }: {
    version: string;
    lastPublishMs: number | null;
    lastMonthDownloads: number;
    now?: number;
  }
): SignalRow[] => {
  const { security, maintenance, quality, provenance, popularity } = signals;
  const rows: (SignalRow | null)[] = [
    security
      ? {
          name: 'Security',
          scorePct: security.scorePct,
          reason: securityReason(security, version)
        }
      : null,
    maintenance
      ? {
          name: 'Maintenance',
          scorePct: maintenance.scorePct,
          reason: maintenanceReason(maintenance, lastPublishMs, now)
        }
      : null,
    quality
      ? {
          name: 'Quality',
          scorePct: quality.scorePct,
          reason: qualityReason(quality)
        }
      : null,
    provenance
      ? {
          name: 'Provenance',
          scorePct: provenance.scorePct,
          reason: provenanceReason(provenance)
        }
      : null,
    popularity
      ? {
          name: 'Popularity',
          scorePct: popularity.scorePct,
          reason: `${compact.format(lastMonthDownloads)} downloads last month`
        }
      : null
  ];

  return rows.filter((row): row is SignalRow => row !== null);
};

/** One sentence that sums the signals up */
export const verdict = (signals: Signals, dependencies: number) => {
  const { security, maintenance, popularity, provenance } = signals;
  const use =
    popularity?.key === 'decent'
      ? 'Widely used'
      : popularity?.key === 'relative-low'
        ? 'Used by some'
        : 'Not widely used yet';
  const care =
    maintenance?.key === 'deprecated'
      ? 'deprecated'
      : maintenance?.key === 'dormant'
        ? 'no longer released'
        : maintenance?.key === 'stale'
          ? 'not released in a while'
          : maintenance?.key === 'fresh' || maintenance?.key === 'stable'
            ? 'actively maintained'
            : 'with an unknown release history';
  const n = vulnCount(security);
  const safety =
    security?.key === 'unknown' || !security
      ? 'vulnerabilities not checked'
      : n === 0
        ? 'no known vulnerabilities'
        : `${n} known ${n === 1 ? 'vulnerability' : 'vulnerabilities'}`;
  const deps =
    dependencies === 0
      ? 'no runtime dependencies'
      : `${dependencies} runtime ${dependencies === 1 ? 'dependency' : 'dependencies'}`;
  const signed = provenance?.reasons.includes('attestations-present')
    ? ' Releases are published with provenance attestations.'
    : '';

  return `${use} and ${care}, with ${safety} and ${deps}.${signed}`;
};

/** Downloads per complete calendar month, oldest first, the last 12 */
export const monthlyTotals = (daily: { day: string; downloads: number }[]) => {
  const totals = completeMonthTotals(daily);

  return Object.keys(totals)
    .sort()
    .slice(-12)
    .map((month) => ({ month, downloads: totals[month] }));
};

/** Downloads per week, counted back from the last day, the last 52 */
export const weeklyTotals = (daily: { day: string; downloads: number }[]) => {
  const weeks: { start: string; downloads: number }[] = [];

  for (let end = daily.length; end >= 7 && weeks.length < 52; end -= 7) {
    const week = daily.slice(end - 7, end);

    weeks.unshift({
      start: week[0].day,
      downloads: week.reduce((sum, d) => sum + d.downloads, 0)
    });
  }

  return weeks;
};

/** Publish times from the packument, newest first */
export const releases = (time: Record<string, string> | undefined) =>
  Object.entries(time ?? {})
    .filter(([version]) => version !== 'created' && version !== 'modified')
    .map(([version, iso]) => ({ version, ms: Date.parse(iso) }))
    .filter((r) => Number.isFinite(r.ms))
    .sort((a, b) => b.ms - a.ms);

export const releasesInLastYear = (all: { ms: number }[], now = Date.now()) =>
  all.filter((r) => r.ms > now - YEAR_MS);
