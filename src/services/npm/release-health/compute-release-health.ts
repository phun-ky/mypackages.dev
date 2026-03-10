import type { NpmRegistryPackument, ReleaseHealth } from '../../../types';
import { toDateMs } from '../../../utils';
import { formatEngines } from '../../../utils/format';
import { normalizeLicense } from '../../../utils/normalize';
import { normalizeDeprecated } from '../../../utils/normalize-deprecated';
import { getLatestVersionFromPackage } from '../packages/utils/get-latest-version-from-package';
import { getPackageByVersion } from '../packages/utils/get-package-by-version';

export const computeReleaseHealth = (
  registryData: NpmRegistryPackument,
  { sampleSize = 8 } = {}
): ReleaseHealth => {
  if (!registryData || typeof registryData !== 'object') {
    return {
      latestVersion: null,
      lastPublishMs: null,
      lastPublishIso: null,
      cadenceAvgMs: null,
      cadenceSample: 0,
      deprecated: false,
      deprecatedMessage: null,
      license: null,
      enginesNode: null,
      hasTypes: false
    };
  }

  const latestVersion = getLatestVersionFromPackage(registryData);
  const latestMeta = getPackageByVersion({
    version: latestVersion,
    pkg: registryData
  });
  const license = normalizeLicense(
    latestMeta?.license ?? registryData.license ?? null
  );
  const enginesNode = formatEngines(latestMeta?.engines ?? null);
  const hasTypes = Boolean(latestMeta?.types || latestMeta?.typings);
  const deprecated = normalizeDeprecated(latestMeta?.deprecated);
  const deprecatedMessage = latestMeta?.deprecated || null;
  const time = registryData.time || { created: '0', modified: '0' };
  const versionTimes = Object.entries(time)
    .filter(
      ([k, v]) => k !== 'created' && k !== 'modified' && typeof v === 'string'
    )
    .map(([ver, iso]) => ({ ver, ms: toDateMs(iso as string), iso }))
    .filter((x) => x.ms != null)
    .sort((a, b) => (b.ms ?? 0) - (a.ms ?? 0));
  const last = versionTimes[0] || null;
  const lastPublishMs =
    (latestVersion && toDateMs(time[latestVersion])) ||
    last?.ms ||
    toDateMs(time.modified) ||
    null;
  const lastPublishIso =
    (latestVersion && time[latestVersion]) ||
    last?.iso ||
    time.modified ||
    null;
  // Cadence: average gap (ms) between last N publishes
  const take = Math.max(2, Math.min(sampleSize, versionTimes.length));
  const sample = versionTimes.slice(0, take);

  let cadenceAvgMs = null;

  if (sample.length >= 2) {
    let sum = 0;

    for (let i = 0; i < sample.length - 1; i++) {
      const a = sample[i].ms;
      const b = sample[i + 1].ms;

      sum += (a ?? 0) - (b ?? 0); // ms gap
    }
    cadenceAvgMs = Math.round(sum / (sample.length - 1));
  }

  return {
    latestVersion,
    lastPublishMs,
    lastPublishIso,
    cadenceAvgMs,
    cadenceSample: sample.length,
    deprecated,
    deprecatedMessage,
    license,
    enginesNode,
    hasTypes
  };
};
