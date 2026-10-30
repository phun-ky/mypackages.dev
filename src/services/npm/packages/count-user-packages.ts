import type { Config } from '../../../types';
import { supabase } from '../../supabase';
import { searchPackagesByUserRole } from '../search-packages-by-user-role';

/**
 * How many packages npm has for a user, which can be more than the site
 * loads (#96). From the same cached search as the packages themselves.
 */
export const countUserPackages = async (
  username: string,
  signal: AbortSignal,
  options?: Config
): Promise<number> => {
  if (!options) return 0;

  const res = await searchPackagesByUserRole(
    supabase,
    username,
    options,
    signal
  );

  return res.total ?? 0;
};
