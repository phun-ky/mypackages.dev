import { clamp } from '../../utils/clamp';
import type { PackageDetails } from '../npm/packages/resolve-package-details';

export type QualityKey = 'unknown' | 'poor' | 'ok' | 'good' | 'excellent';

export type QualityLabel = 'Unknown' | 'Poor' | 'OK' | 'Good' | 'Excellent';

export type QualityResult = {
  key: QualityKey;
  label: QualityLabel;
  title: string;
  scorePct: number;
  meta?: {
    hasTypes?: boolean;
    hasTests?: boolean;
    hasEnginesNode?: boolean;
    hasExports?: boolean;
    isEsm?: boolean;
    hasLicense?: boolean;
    hasRepo?: boolean;
    readmeChars?: number;
  };
};

const isPlaceholderTest = (cmd?: string) => {
  if (!cmd) return true;

  const v = cmd.toLowerCase();

  return (v.includes('no test') && v.includes('echo')) || v.includes('exit 1');
};
const hasTestDeps = (deps?: Record<string, string>) => {
  if (!deps) return false;

  const keys = Object.keys(deps);

  return keys.some((k) =>
    [
      'jest',
      'vitest',
      'mocha',
      'ava',
      'cobertura',
      'tap',
      '@playwright/test',
      'cypress',
      'uvu'
    ].includes(k)
  );
};

export const packageQuality = (details: PackageDetails): QualityResult => {
  const rh = details.releaseHealth;
  const latestVersion = rh?.latestVersion;
  const latestMeta =
    latestVersion && details.versions?.[latestVersion]
      ? details.versions[latestVersion]
      : undefined;
  const hasLicense = Boolean(rh?.license ?? details.license);
  const hasRepo = Boolean(
    details.repository && (details.repository.url || details.repository.type)
  );
  const readmeChars = details.readme?.length ?? 0;

  if (!latestMeta) {
    const base =
      (hasLicense ? 10 : 0) + (hasRepo ? 10 : 0) + (readmeChars > 200 ? 10 : 0);
    const scorePct = clamp(40 + base, 0, 100);
    const key: QualityKey =
      scorePct >= 70 ? 'good' : scorePct >= 50 ? 'ok' : 'poor';
    const label: QualityLabel =
      key === 'good' ? 'Good' : key === 'ok' ? 'OK' : 'Poor';

    return {
      key,
      label,
      title: 'Limited version metadata (scored from top-level registry fields)',
      scorePct,
      meta: { hasLicense, hasRepo, readmeChars }
    };
  }

  // Deprecated: prefer normalized boolean, but keep message if present
  const deprecatedMsg =
    typeof latestMeta.deprecated === 'string'
      ? latestMeta.deprecated.trim()
      : '';

  if (rh?.deprecated || deprecatedMsg) {
    return {
      key: 'poor',
      label: 'Poor',
      title: deprecatedMsg ? `Deprecated: ${deprecatedMsg}` : 'Deprecated',
      scorePct: 5
    };
  }

  const hasTypes =
    rh?.hasTypes ?? Boolean(latestMeta.types || latestMeta.typings);
  const hasExports = Boolean(latestMeta.exports);
  const isEsm = latestMeta.type === 'module'; // keep exports separate
  const hasEnginesNode =
    Boolean(rh?.enginesNode) || Boolean(latestMeta.engines?.node);
  const hasTests =
    (latestMeta.scripts?.test && !isPlaceholderTest(latestMeta.scripts.test)) ||
    hasTestDeps(latestMeta.devDependencies);

  let score = 0;

  score += hasTypes ? 30 : 0;
  score += hasTests ? 20 : 0;

  score += hasExports ? 15 : 0;
  score += isEsm ? 8 : 0;
  score += hasEnginesNode ? 10 : 0;

  score += hasLicense ? 7 : 0;
  score += hasRepo ? 7 : 0;
  score += readmeChars > 500 ? 8 : readmeChars > 200 ? 4 : 0;

  const hasEntrypoint =
    Boolean(latestMeta.main) ||
    Boolean(latestMeta.module) ||
    hasExports ||
    hasTypes;

  if (!hasEntrypoint) score -= 10;

  score = clamp(Math.round(score), 0, 100);

  const key: QualityKey =
    score >= 85
      ? 'excellent'
      : score >= 70
        ? 'good'
        : score >= 50
          ? 'ok'
          : 'poor';
  const label: QualityLabel =
    key === 'excellent'
      ? 'Excellent'
      : key === 'good'
        ? 'Good'
        : key === 'ok'
          ? 'OK'
          : 'Poor';
  const titleParts = [
    hasTypes ? 'Types' : 'No types',
    hasTests ? 'Tests' : 'No tests',
    hasExports ? 'Exports' : 'No exports',
    hasEnginesNode ? 'Node engine' : 'No engine'
  ];

  return {
    key,
    label,
    title: titleParts.join(' · '),
    scorePct: score,
    meta: {
      hasTypes,
      hasTests,
      hasEnginesNode,
      hasExports,
      isEsm,
      hasLicense,
      hasRepo,
      readmeChars
    }
  };
};
