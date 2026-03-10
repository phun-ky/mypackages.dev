import type { SupabaseClient } from '@supabase/supabase-js';

import { DAY_MS } from '../../constants/temporal';
import type { NpmPackageName } from '../../types';
import { HttpError } from '../../utils/error/HttpError.class';
import { cachedAsync } from '../../utils/storage/cached-async';

const downloadLastMonthHistoryCache = new Map();

export type LastMonthResponse = { downloads: number; package: string };

export const getLastMonthDownloads = async (
  supabase: SupabaseClient,
  name: NpmPackageName,
  signal?: AbortSignal
): Promise<LastMonthResponse> => {
  const key = `downloads:last-month:${name}`;

  return cachedAsync(
    downloadLastMonthHistoryCache,
    key,
    { ttlMs: DAY_MS },
    async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        const headers: Record<string, string> = {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY.trim()
        };

        // Optional auth -> enables server-side token usage
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token.trim()}`;
        }

        const { data, error } = await supabase.functions.invoke(
          'npm-downloads-last-month',
          {
            body: { name },
            headers,
            signal
          }
        );

        if (error) {
          throw new HttpError(0, 'npm-downloads-last-month', error.message);
        }

        if (!data?.ok) {
          const status = Number(data?.status ?? 0);
          const url = String(data?.url ?? 'npm-downloads-last-month');
          const rawBody =
            typeof data?.body === 'string' ? data.body : undefined;
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

        return data.data as LastMonthResponse;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') throw e;

        if (e instanceof HttpError) throw e;

        const url = `npm-downloads-last-month:${name}`;
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
    }
  );
};
