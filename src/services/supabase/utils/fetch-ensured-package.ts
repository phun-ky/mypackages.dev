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

export const getEnsuredPackageNames = (signal: AbortSignal) => {
  return cachedAsync(
    ensuredCache,
    'supabase:ensured-packages',
    { ttlMs: HOUR_MS },
    async () => {
      const rows = await fetchEnsuredPackages(signal);

      return rows.map((r) => r.package_name).filter(Boolean);
    }
  );
};
