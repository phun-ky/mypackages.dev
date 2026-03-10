import type { PackageEngines, RelativeTimeFormatUnitsList } from '../types';

export const formatEngines = (engines: PackageEngines) => {
  if (!engines || typeof engines !== 'object') return null;

  const node = typeof engines.node === 'string' ? engines.node : null;

  return node ? `node ${node}` : null;
};

export const formatRelativeTime = (
  fromMs: number,
  toMs = Date.now(),
  locale = 'en-GB' // navigator.language
) => {
  const diffMs = toMs - fromMs;
  const diffSec = Math.round(diffMs / 1000);

  // Future dates / clock skew
  if (!Number.isFinite(diffSec) || diffSec < 0) return 'just now';

  const rtf =
    typeof Intl !== 'undefined' && Intl.RelativeTimeFormat
      ? new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
      : null;
  // Ordered largest->smallest for good “human” output
  const units: RelativeTimeFormatUnitsList = [
    { unit: 'year', seconds: 60 * 60 * 24 * 365 },
    { unit: 'month', seconds: 60 * 60 * 24 * 30 },
    { unit: 'week', seconds: 60 * 60 * 24 * 7 },
    { unit: 'day', seconds: 60 * 60 * 24 },
    { unit: 'hour', seconds: 60 * 60 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 }
  ];

  for (const { unit, seconds } of units) {
    const value = Math.floor(diffSec / seconds);

    if (value >= 1) {
      // Past => negative value for RelativeTimeFormat (“… ago”)
      if (rtf) return rtf.format(-value, unit);

      // Fallback
      const label = value === 1 ? unit : `${unit}s`;

      return `${value} ${label} ago`;
    }
  }

  return rtf ? rtf.format(0, 'second') : 'just now';
};
