import { YEAR_MS } from '../../../constants/temporal';
import type { NpmPackageNames, Username } from '../../../types';
import { isAbort } from '../../../utils';
import { lsKey } from '../../../utils/storage/ls-key';
import { ttlLocalStorage } from '../../../utils/storage/ttl-local-storage';
import { getEnsuredPackageNames } from '../../supabase/utils/fetch-ensured-package';

// `maintainer` in the key as before, when there was an author mode too (#95),
// so what's been learned is kept
const trackedKey = (username: Username) =>
  lsKey(`tracked-packages:${username}:maintainer`);

export const getTrackedPackages = async (
  username: Username,
  signal: AbortSignal
) => {
  const u = (username ?? '').trim();

  if (!u) return [];

  const v = ttlLocalStorage.get(trackedKey(u));

  if (Array.isArray(v)) return v.filter(Boolean) as string[];

  // Tracked packages only add to what npm's search finds, so the page
  // shows the search's packages if they can't be read
  try {
    return await getEnsuredPackageNames(signal);
  } catch (e) {
    if (isAbort(e as Error)) throw e;

    return [];
  }
};

const setTrackedPackages = (names: NpmPackageNames, username: Username) => {
  const u = (username ?? '').trim();

  if (!u) return [];

  const unique = [...new Set(names.map(String).filter(Boolean))].sort();

  ttlLocalStorage.set(trackedKey(u), unique, YEAR_MS);

  return unique;
};

// Call this to "learn" newly found packages so they stay even if deprecated later
export const mergeIntoTracked = async (
  names: NpmPackageNames,
  username: Username,
  signal: AbortSignal
) => {
  const u = (username ?? '').trim();

  if (!u) return [];

  const current = await getTrackedPackages(u, signal);

  return setTrackedPackages([...current, ...names], u);
};
