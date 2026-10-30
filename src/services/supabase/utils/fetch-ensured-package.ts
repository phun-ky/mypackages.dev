import { supabase } from '..';
import { HOUR_MS } from '../../../constants/temporal';
import type { EnsuredRow } from '../../../features/profile/ensured-packages';
import { cachedAsync } from '../../../utils/storage/cached-async';

export const fetchEnsuredPackages = async (
  signal: AbortSignal
): Promise<EnsuredRow[]> => {
  const { data, error } = await supabase
    .from('ensured_packages')
    .select('id, package_name, registry')
    .order('created_at', { ascending: true })
    .abortSignal(signal);

  if (error) throw error;

  return (data ?? []) as EnsuredRow[];
};

const ensuredCache = new Map<string, Promise<string[]> | string[]>();

/**
 * The packages the signed-in user has added in their profile. Nothing for a
 * signed-out visitor, who may not read the table (#54). Cached per user, so
 * signing out or in again doesn't keep someone else's.
 */
export const getEnsuredPackageNames = async (
  signal: AbortSignal
): Promise<string[]> => {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) return [];

  return cachedAsync(
    ensuredCache,
    `supabase:ensured-packages:${session.user.id}`,
    { ttlMs: HOUR_MS },
    async () => {
      const rows = await fetchEnsuredPackages(signal);

      return rows.map((r) => r.package_name).filter(Boolean);
    }
  );
};
