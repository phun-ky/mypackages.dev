import { YEAR_MS } from '../../../constants/temporal';
import type { NpmPackageNames, Role, Username } from '../../../types';
import { lsKey } from '../../../utils/storage/ls-key';
import { ttlLocalStorage } from '../../../utils/storage/ttl-local-storage';
import { getEnsuredPackageNames } from '../../supabase/utils/fetch-ensured-package';

const trackedKey = (role: Role, username: Username) =>
  lsKey(`tracked-packages:${username}:${role}`);

export const getTrackedPackages = async (
  username: Username,
  role: Role,
  signal: AbortSignal
) => {
  const u = (username ?? '').trim();

  if (!u) return [];

  const v = ttlLocalStorage.get(trackedKey(role, u));

  if (Array.isArray(v)) return v.filter(Boolean) as string[];

  return await getEnsuredPackageNames(signal);
};

const setTrackedPackages = (
  names: NpmPackageNames,
  username: Username,
  role: Role
) => {
  const u = (username ?? '').trim();

  if (!u) return [];

  const unique = [...new Set(names.map(String).filter(Boolean))].sort();

  ttlLocalStorage.set(trackedKey(role, u), unique, YEAR_MS);

  return unique;
};

// Call this to "learn" newly found packages so they stay even if deprecated later
export const mergeIntoTracked = async (
  names: NpmPackageNames,
  username: Username,
  role: Role,
  signal: AbortSignal
) => {
  const u = (username ?? '').trim();

  if (!u) return [];

  const current = await getTrackedPackages(u, role, signal);

  return setTrackedPackages([...current, ...names], u, role);
};
