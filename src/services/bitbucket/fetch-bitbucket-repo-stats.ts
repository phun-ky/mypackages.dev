/* eslint-disable @typescript-eslint/no-explicit-any */
import { DAY_MS } from '../../constants/temporal';
import { HttpError } from '../../utils/error/HttpError.class';
import { cachedAsync } from '../../utils/storage/cached-async';
import type { RepoStats } from '../git/types';

import { getBitbucketRepoRef } from './get-bitbucket-repo-ref';

const bitbucketCache = new Map();

export const fetchBitbucketRepoStats = async (props: {
  repoUrl?: string | null;
  token?: string; // optional: OAuth bearer or app password token
  signal?: AbortSignal;
}): Promise<RepoStats | null> => {
  const { repoUrl, token, signal } = props;
  const ref = getBitbucketRepoRef(repoUrl); // { workspace, repo }

  if (!ref) return null;

  const { workspace, repo } = ref;
  const headers: Record<string, string> = {
    Accept: 'application/json'
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const key = `bitbucket:repo:${workspace}:${repo}`;

  return cachedAsync(bitbucketCache, key, { ttlMs: DAY_MS }, async () => {
    const url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repo}`;
    const res = await fetch(url, { headers, signal });

    if (!res.ok) {
      const body = await res.text().catch(() => undefined);
      const rawBody = typeof body === 'string' ? body : undefined;
      const status = res.status;

      throw new HttpError(status || 0, url, {
        kind: status >= 500 ? 'upstream' : 'client',
        message: rawBody ?? `Upstream error: ${status || 'unknown'}`
      });
    }

    const data = (await res.json()) as any;

    return {
      provider: 'bitbucket',

      watchers: Number(data.watchers?.size ?? 0),
      forks: Number(data.forks?.size ?? 0),
      updatedAt: String(data.updated_on ?? data.updated_at ?? '')
    } satisfies RepoStats;
  });
};
