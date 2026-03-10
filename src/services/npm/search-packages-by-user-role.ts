import type { SupabaseClient } from '@supabase/supabase-js';

import { DAY_MS } from '../../constants/temporal';
import type { Config, NpmRegistrySearchResponse } from '../../types';
import { isValidEmail } from '../../utils/is-valid-email';
import { cachedAsync } from '../../utils/storage/cached-async';

const searchCache = new Map();

export const searchPackagesByUserRole = async (
  supabase: SupabaseClient,
  username: string,
  options: Config,
  signal?: AbortSignal
): Promise<NpmRegistrySearchResponse> => {
  const { responseSize = 250, maintainer } = options;
  const role = maintainer ? 'maintainer' : 'author';
  const query =
    isValidEmail(username) && role === 'author'
      ? `author.email:${username}`
      : `${role}:${username}`;
  const key = `search:${query}:size:${responseSize}`;

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
          mode: role, // 'author' | 'maintainer'
          size: responseSize // edge clamps to <= 250
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
