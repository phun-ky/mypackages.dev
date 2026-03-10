/* eslint-disable @typescript-eslint/no-explicit-any */
import { DAY_MS } from '../../constants/temporal';
import { HttpError } from '../../utils/error/HttpError.class';
import { cachedAsync } from '../../utils/storage/cached-async';
import type { RepoStats } from '../git/types';

import { getGitLabRepoRef } from './get-gitlab-repo-ref';

const gitlabCache = new Map();

export const fetchGitLabRepoStats = async (props: {
  repoUrl?: string | null;
  token?: string; // optional for higher rate/private projects
  signal?: AbortSignal;
}): Promise<RepoStats | null> => {
  const { repoUrl, token, signal } = props;
  const ref = getGitLabRepoRef(repoUrl); // implement similarly to getGitHubRepoRef

  if (!ref) return null;

  const { host, fullPath } = ref; // host: gitlab.com or self-hosted, fullPath: group/sub/repo
  const projectId = encodeURIComponent(fullPath);
  const headers: Record<string, string> = {
    Accept: 'application/json'
  };

  if (token) headers.Authorization = `Bearer ${token}`; // GitLab supports Bearer / Private-Token

  const key = `gitlab:repo:${host}:${fullPath}`;

  return cachedAsync(gitlabCache, key, { ttlMs: DAY_MS }, async () => {
    const url = `https://${host}/api/v4/projects/${projectId}`;
    const res = await fetch(url, { headers, signal });

    if (!res.ok) {
      const body = await res.text().catch(() => undefined);
      const status = Number(res?.status ?? 0);
      const rawBody = typeof body === 'string' ? body : undefined;

      throw new HttpError(status || 0, url, {
        kind: status >= 500 ? 'upstream' : 'client',
        message: rawBody ?? `Upstream error: ${status || 'unknown'}`
      });
    }

    const data = (await res.json()) as any;

    return {
      provider: 'gitlab',
      stars: Number(data.star_count ?? 0),
      forks: Number(data.forks_count ?? 0),
      openIssues: Number(data.open_issues_count ?? 0),
      updatedAt: String(data.last_activity_at ?? '')
    } satisfies RepoStats;
  });
};
