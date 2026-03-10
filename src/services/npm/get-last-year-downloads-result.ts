/* eslint-disable @stylistic/indent */
import type { NpmPackageName } from '../../types';
import { isAbort } from '../../utils';
import { HttpError } from '../../utils/error/HttpError.class';
import { supabase } from '../supabase';

import {
  getLastYearDownloads,
  type LastYearRangeResponse
} from './get-last-year-downloads';

export type DownloadsResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: 'abort' }
  | {
      ok: false;
      kind: 'http';
      body?: string;
      status: number;
      retryAfterSeconds?: number;
      url?: string;
    }
  | {
      ok: false;
      kind: 'network';
      message?: string;
      url?: string;
    };

export const getLastYearDownloadsResult = async (
  name: NpmPackageName,
  signal?: AbortSignal
): Promise<DownloadsResult<LastYearRangeResponse>> => {
  try {
    const data = await getLastYearDownloads(supabase, name, signal);

    return { ok: true, data };
  } catch (e) {
    if (isAbort(e as Error)) return { ok: false, kind: 'abort' };

    if (e instanceof HttpError) {
      if (e.status === 0) {
        return { ok: false, kind: 'network', message: e.body, url: e.url };
      }

      return {
        ok: false,
        kind: 'http',
        status: e.status,
        body: e.body,
        url: e.url,
        retryAfterSeconds: e.retryAfterSeconds
      };
    }

    return {
      ok: false,
      kind: 'network'
    };
  }
};
