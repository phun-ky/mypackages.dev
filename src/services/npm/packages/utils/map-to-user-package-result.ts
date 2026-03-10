/* eslint-disable @stylistic/indent */
import type {
  NpmPackage,
  NpmIdentity,
  NpmRegistryPackument,
  ReleaseHealth
} from '../../../../types';
import { normalizeGithubRepoUrl } from '../../../../utils/normalize';
import { supabase } from '../../../supabase';
import { getLastMonthDownloads } from '../../get-last-month-downloads';
import { getPackageDetails } from '../../get-package-details';
import { computeReleaseHealth } from '../../release-health/compute-release-health';

export const mapToUserPackageResult =
  (
    byName: Map<string, { pkg: NpmPackage; updated: string; monthly: number }>,
    signal?: AbortSignal
  ) =>
  async (name: string) => {
    // Base data from search if available
    const s = byName.get(name);

    // Registry is source of truth for maintainers + release health + deprecated message
    let detailData: NpmRegistryPackument | null = null;
    let maintainers: NpmIdentity[] = [];
    let releaseHealth: ReleaseHealth | undefined = undefined;

    try {
      detailData = await getPackageDetails(supabase, name, signal);
      maintainers = detailData.maintainers || [];
      releaseHealth = computeReleaseHealth(detailData, { sampleSize: 8 });
    } catch (err) {
      console.warn(`Failed to fetch registry details for ${name}:`, err);
    }

    // Monthly downloads:
    // - Use search monthly if present, else call downloads API
    let monthly = s?.monthly ?? null;

    if (monthly == null) {
      try {
        const lm = await getLastMonthDownloads(supabase, name, signal);

        monthly = parseInt(`${lm?.downloads}`) || 0;
      } catch (err) {
        console.warn(`Failed last-month downloads for ${name}:`, err);
        monthly = 0;
      }
    }

    // Compose "package" object in your existing shape
    const pkgFromSearch: Partial<NpmPackage> | undefined = s?.pkg;

    return {
      package: {
        ...pkgFromSearch,
        name,
        // keep existing fields if present; fall back to registry where useful
        keywords: pkgFromSearch?.keywords || [],
        links: pkgFromSearch?.links || {
          npm: `https://www.npmjs.com/package/${encodeURIComponent(name)}`,
          repository:
            normalizeGithubRepoUrl(detailData?.repository) ||
            normalizeGithubRepoUrl(pkgFromSearch?.links?.repository)
        },
        updated:
          s?.updated ||
          pkgFromSearch?.date ||
          detailData?.time?.modified ||
          undefined,
        maintainers,
        releaseHealth,
        // Helpful flag for UI: package was not discoverable in search (likely deprecated or private/unindexed)
        isTrackedOnly: !byName.has(name)
      },
      downloads: {
        monthly
      }
    };
  };
