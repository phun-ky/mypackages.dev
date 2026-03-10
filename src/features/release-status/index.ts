import type { ReleaseHealth } from '../../types';
import { formatRelativeTime } from '../../utils/format';

export const releaseStatusFromHealth = (
  releaseHealth?: ReleaseHealth,
  downloads?: number
) => {
  if (!releaseHealth) {
    return { key: 'unknown', label: 'Unknown', title: 'No registry data' };
  }

  if (releaseHealth.deprecated) {
    return {
      key: 'deprecated',
      label: 'Deprecated',
      title:
        typeof releaseHealth.deprecated === 'string'
          ? releaseHealth.deprecated
          : 'Package is marked deprecated'
    };
  }

  const ms = releaseHealth.lastPublishMs;

  if (!ms) {
    return {
      key: 'unknown',
      label: 'Unknown',
      title: 'Publish date unavailable'
    };
  }

  const ageDays = Math.floor((Date.now() - ms) / (24 * 60 * 60 * 1000));
  const rel = formatRelativeTime(ms);

  if (ageDays <= 60) {
    return { key: 'fresh', label: 'Fresh', title: `Published ${rel}` };
  }

  // Stable = older, but still heavily used
  if (ageDays > 180 && downloads != null && downloads >= 1000) {
    return { key: 'stable', label: 'Stable', title: `Last publish ${rel}` };
  }

  if (ageDays <= 180) {
    return { key: 'stale', label: 'Stale', title: `Last publish ${rel}` };
  }

  if (ageDays > 365) {
    return { key: 'dormant', label: 'Dormant', title: `Last publish ${rel}` };
  }

  return { key: 'dormant', label: 'Dormant', title: `Last publish ${rel}` };
};
