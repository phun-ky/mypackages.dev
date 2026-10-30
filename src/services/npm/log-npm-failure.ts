import { assertNever } from '../../utils/error/assert-never';

import type { DownloadsResult } from './get-last-year-downloads-result';

type Failure = Extract<DownloadsResult<unknown>, { ok: false }>;

/**
 * Says in the console why a request to npm failed: the page only shows the
 * numbers as missing. Leaving a page aborts its requests, and npm answers
 * 404 for an unknown package and 429 when it limits the site, so those
 * aren't logged.
 */
export const logNpmFailure = (what: string, res: Failure) => {
  switch (res.kind) {
    case 'abort': {
      return;
    }
    case 'http': {
      if (res.status === 404 || res.status === 429) return;

      // eslint-disable-next-line no-console -- why numbers are missing, for whoever reports it
      console.warn(`${what}: npm answered ${res.status}`, res.url ?? '');

      return;
    }
    case 'network': {
      // eslint-disable-next-line no-console -- why numbers are missing, for whoever reports it
      console.warn(
        `${what}: no answer from npm`,
        res.url ?? '',
        res.message ?? ''
      );

      return;
    }
    default: {
      assertNever(res);
    }
  }
};
