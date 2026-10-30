import type { SupabaseClient } from '@supabase/supabase-js';

import { DAY_MS } from '../../constants/temporal';
import type { Config, NpmRegistrySearchResponse } from '../../types';
import { cachedAsync } from '../../utils/storage/cached-async';

const searchCache = new Map();

/**
 * The packages a user maintains, from npm's search. Only maintainers: npm's
 * `author:` matches whoever published the latest version, which trusted
 * publishing records as GitHub Actions (#95). Up to 500 (#96); `total` says
 * how many there are.
 */
export const searchPackagesByUserRole = async (
  supabase: SupabaseClient,
  username: string,
  options: Config,
  signal?: AbortSignal
): Promise<NpmRegistrySearchResponse> => {
  const { responseSize = 500 } = options;
  const key = `search:maintainer:${username}:size:${responseSize}`;

  return await cachedAsync(searchCache, key, { ttlMs: DAY_MS }, async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY.trim()
    };

    // Optional auth: send JWT if present (enables token usage server-side)
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token.trim()}`;
    }

    const { data, error } = await supabase.functions.invoke(
      'npm-search-by-user-role',
      {
        body: {
          username,
          size: responseSize // edge clamps to <= 500
        },
        headers,
        signal
      }
    );

    if (error) throw new Error(error.message);

    if (!data?.ok) throw new Error(data?.error ?? 'Search failed');

    return data.data as NpmRegistrySearchResponse;
  });
};
