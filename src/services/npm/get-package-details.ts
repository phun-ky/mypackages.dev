import type { SupabaseClient } from '@supabase/supabase-js';

import { DAY_MS } from '../../constants/temporal';
import type { NpmRegistryPackument, NpmPackageName } from '../../types';
import { HttpError } from '../../utils/error/HttpError.class';
import { cachedAsync } from '../../utils/storage/cached-async';

const registryCache = new Map();

export const getPackageDetails = async (
  supabase: SupabaseClient,
  name: NpmPackageName,
  signal?: AbortSignal
): Promise<NpmRegistryPackument> => {
  const key = `registry:${name}`;

  return cachedAsync(registryCache, key, { ttlMs: DAY_MS }, async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY.trim()
      };

      // Optional auth: enables token usage server-side
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token.trim()}`;
      }

      const { data, error } = await supabase.functions.invoke(
        'npm-package-details',
        {
          body: { name },
          headers,
          signal
        }
      );

      if (error) {
        throw new HttpError(0, 'npm-package-details', error.message);
      }

      if (!data?.ok) {
        const status = Number(data?.status ?? 0);
        const url = String(data?.url ?? 'npm-package-details');
        const rawBody = typeof data?.body === 'string' ? data.body : undefined;
        const retryAfterSeconds =
          typeof data?.retryAfterSeconds === 'number'
            ? data.retryAfterSeconds
            : undefined;

        if (status === 429) {
          throw new HttpError(status, url, {
            kind: 'rate_limited',
            retryAfterSeconds,
            body: rawBody,
            message: `Rate limited by npm${retryAfterSeconds ? ` — try again in ${retryAfterSeconds}s` : ''}.`
          });
        }

        throw new HttpError(status || 0, url, {
          kind: status >= 500 ? 'upstream' : 'client',
          retryAfterSeconds,
          message: rawBody ?? `Upstream error: ${status || 'unknown'}`
        });
      }

      return data.data as NpmRegistryPackument;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw e;

      if (e instanceof HttpError) throw e;

      const url = `npm-package-details:${name}`;
      const message =
        e instanceof Error
          ? e.message
          : typeof e === 'string'
            ? e
            : 'Network error';

      throw new HttpError(0, url, {
        kind: 'network',
        message
      });
    }
  });
};
