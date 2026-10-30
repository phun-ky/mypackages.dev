import { YEAR_MS } from '../../../constants/temporal';
import type { NpmPackageNames, Username } from '../../../types';
import { isAbort } from '../../../utils';
import { lsKey } from '../../../utils/storage/ls-key';
import { ttlLocalStorage } from '../../../utils/storage/ttl-local-storage';
import { supabase } from '../../supabase';
import { getEnsuredPackageNames } from '../../supabase/utils/fetch-ensured-package';
import { getUserSettings } from '../../supabase/utils/user-settings';

// The packages npm's search has found for a user, kept for a year so one
// that drops out of the search (deprecated, say) is still shown. Only what
// the search found for that user: a list from before #113 could hold the
// signed-in user's own packages, so `v2`, and ttlLocalStorage.sweep removes
// the old ones.
const trackedKey = (username: Username) =>
  lsKey(`tracked-packages:v2:${username}`);
const storedTracked = (username: Username): string[] => {
  const v = ttlLocalStorage.get(trackedKey(username));

  return Array.isArray(v) ? (v.filter(Boolean) as string[]) : [];
};
// Whether `username` is the signed-in user's own npm username, from their
// profile settings
const isOwnUsername = async (username: Username) => {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const { npmUsername } = await getUserSettings(session);

  return npmUsername?.toLowerCase() === username.toLowerCase();
};

/**
 * The packages to show for `username` besides npm's search results: the
 * ones the search found before, and on the signed-in user's own page, the
 * ones they added in their profile (#113).
 */
export const getTrackedPackages = async (
  username: Username,
  signal: AbortSignal
) => {
  const u = (username ?? '').trim();

  if (!u) return [];

  const stored = storedTracked(u);

  if (!(await isOwnUsername(u))) return stored;

  // Tracked packages only add to what npm's search finds, so the page
  // shows the search's packages if they can't be read
  try {
    return [...new Set([...stored, ...(await getEnsuredPackageNames(signal))])];
  } catch (e) {
    if (isAbort(e as Error)) throw e;

    return stored;
  }
};

/** Remembers the packages npm's search found for `username`. */
export const mergeIntoTracked = (
  names: NpmPackageNames,
  username: Username
) => {
  const u = (username ?? '').trim();

  if (!u) return [];

  const unique = [
    ...new Set([...storedTracked(u), ...names.map(String)].filter(Boolean))
  ].sort();

  ttlLocalStorage.set(trackedKey(u), unique, YEAR_MS);

  return unique;
};
