/* eslint-disable @stylistic/indent */
import type { NpmPackageName } from '../../types';
import { isAbort } from '../../utils';
import { HttpError } from '../../utils/error/HttpError.class';
import { supabase } from '../supabase';

import {
  getLastMonthDownloads,
  type LastMonthResponse
} from './get-last-month-downloads';

export type DownloadsResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: 'abort' }
  | {
      ok: false;
      kind: 'http';
      status: number;
      retryAfterSeconds?: number;
      url?: string;
    }
  | { ok: false; kind: 'network' };

export const getLastMonthDownloadsResult = async (
  name: NpmPackageName,
  signal?: AbortSignal
): Promise<DownloadsResult<LastMonthResponse>> => {
  try {
    const data = await getLastMonthDownloads(supabase, name, signal);

    return { ok: true, data };
  } catch (e) {
    if (isAbort(e as Error)) return { ok: false, kind: 'abort' };

    if (e instanceof HttpError)
      return {
        ok: false,
        kind: 'http',
        status: e.status,
        url: e.url,
        retryAfterSeconds: e.retryAfterSeconds
      };

    return { ok: false, kind: 'network' };
  }
};
