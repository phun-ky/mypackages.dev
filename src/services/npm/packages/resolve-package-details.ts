import type {
  NpmIdentity,
  NpmRegistryPackument,
  ReleaseHealth
} from '../../../types';
import { getLastMonthDownloadsResult } from '../get-last-month-downloads-result';
import { getPackageDetailsResult } from '../get-package-details-result';
import { logNpmFailure } from '../log-npm-failure';
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
    logNpmFailure(`Package details for ${name}`, res);

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
