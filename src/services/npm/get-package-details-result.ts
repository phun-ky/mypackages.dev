import type { NpmPackageName, NpmRegistryPackument } from '../../types';
import { isAbort } from '../../utils';
import { HttpError } from '../../utils/error/HttpError.class';
import { supabase } from '../supabase';

import type { DownloadsResult } from './get-last-year-downloads-result';
import { getPackageDetails } from './get-package-details';

export const getPackageDetailsResult = async (
  name: NpmPackageName,
  signal?: AbortSignal
): Promise<DownloadsResult<NpmRegistryPackument>> => {
  try {
    const data = await getPackageDetails(supabase, name, signal);

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
