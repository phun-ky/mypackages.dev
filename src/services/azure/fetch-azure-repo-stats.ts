/* eslint-disable @typescript-eslint/no-explicit-any */
import { DAY_MS } from '../../constants/temporal';
import { HttpError } from '../../utils/error/HttpError.class';
import { cachedAsync } from '../../utils/storage/cached-async';
import type { RepoStats } from '../git/types';

import { getAzureRepoRef } from './get-azure-repo-ref';

const azureCache = new Map();

export const fetchAzureRepoStats = async (props: {
  repoUrl?: string | null;
  token?: string; // optional: ADO PAT or OAuth; anonymous is limited
  signal?: AbortSignal;
}): Promise<RepoStats | null> => {
  const { repoUrl, token, signal } = props;
  const ref = getAzureRepoRef(repoUrl); // { org, project, repo }

  if (!ref) return null;

  const { org, project, repo } = ref;
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (token) headers.Authorization = `Basic ${btoa(`:${token}`)}`; // PAT style

  const key = `azure:repo:${org}:${project}:${repo}`;

  return cachedAsync(azureCache, key, { ttlMs: DAY_MS }, async () => {
    const url = `https://dev.azure.com/${org}/${project}/_apis/git/repositories/${repo}?api-version=7.1-preview.1`;
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
      provider: 'azure',
      updatedAt: String(data?.project?.lastUpdateTime ?? '') // sometimes present; otherwise omit
    } satisfies RepoStats;
  });
};
