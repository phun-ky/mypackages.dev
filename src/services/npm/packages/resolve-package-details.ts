import type {
  NpmIdentity,
  NpmRegistryPackument,
  ReleaseHealth
} from '../../../types';
import { assertNever } from '../../../utils/error/assert-never';
import { getLastMonthDownloadsResult } from '../get-last-month-downloads-result';
import { getPackageDetailsResult } from '../get-package-details-result';
import { computeReleaseHealth } from '../release-health/compute-release-health';

export type PackageDetails = Partial<NpmRegistryPackument> & {
  name: string;
  keywords: string[];
  maintainers: NpmIdentity[];
  releaseHealth: ReleaseHealth | undefined;
  downloads: { monthly: number };
};

export const resolvePackageDetails = async (
  name: string,
  signal: AbortSignal
): Promise<PackageDetails> => {
  let maintainers: NpmIdentity[] = [];
  let releaseHealth: ReleaseHealth | undefined = undefined;

  const res = await getPackageDetailsResult(name, signal);

  if (!res.ok) {
    switch (res.kind) {
      case 'http': {
        const { status, url, retryAfterSeconds } = res;

        if (status >= 500) {
          console.warn('Downloads API server error', status, url);
        } else if (status === 429) {
          console.debug?.(
            'Downloads API rate limited',
            status,
            url,
            retryAfterSeconds
          );
        } else if (status !== 404) {
          console.warn('Downloads API client error', status, url);
        }

        break;
      }
      case 'abort': {
        // totally normal; do nothing
        break;
      }
      case 'network': {
        // optional: console.debug / metrics, but not console.error
        break;
      }
      default: {
        assertNever(res);
      }
    }

    return {
      name,

      keywords: [],
      maintainers,
      releaseHealth,
      downloads: {
        monthly: 0
      }
    };
  } else {
    const { data } = res;

    maintainers = data.maintainers || [];
    releaseHealth = computeReleaseHealth(data, { sampleSize: 8 });

    // Monthly downloads:
    // - Use search monthly if present, else call downloads API
    let monthly = null;

    if (monthly == null) {
      const res = await getLastMonthDownloadsResult(
        name,

        signal
      );

      if (!res.ok) {
        monthly = 0;
      } else {
        const { data } = res;

        monthly = parseInt(`${data?.downloads}`) || 0;
      }
    }

    return {
      ...data,
      name,
      keywords: data?.keywords || [],
      maintainers,
      releaseHealth,
      downloads: {
        monthly
      }
    };
  }
};
