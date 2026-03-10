/* eslint-disable @typescript-eslint/no-explicit-any */
import { GITHUB_API } from '../../constants';
import { DAY_MS } from '../../constants/temporal';
import { HttpError } from '../../utils/error/HttpError.class';
import { cachedAsync } from '../../utils/storage/cached-async';

import { getGitHubRepoRef } from './utils/get-github-repo-ref';

export type GitHubRepoStats = {
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  updatedAt: string; // ISO
};

const githubStarsCache = new Map();

export const fetchGitHubRepoStats = async (props: {
  repoUrl?: string | null;
  token?: string; // optional: increases rate limit, required for private repos
  signal?: AbortSignal;
}): Promise<GitHubRepoStats | null> => {
  const { repoUrl, token, signal } = props;
  const ref = getGitHubRepoRef(repoUrl);

  if (!ref) return null;

  const { owner, repo } = ref;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json'
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const key = `github:stars:${repo}`;

  return cachedAsync(githubStarsCache, key, { ttlMs: DAY_MS }, async () => {
    const url = `${GITHUB_API}/repos/${owner}/${repo}`;
    const res = await fetch(url, { headers, signal });

    if (!res.ok) {
      const retryAfterHeader = res.headers.get('retry-after');
      const retryAfterSeconds = retryAfterHeader
        ? Number(retryAfterHeader)
        : undefined;
      // Body can be useful for debugging, but keep it best-effort
      const body = await res.text().catch(() => undefined);
      const status = Number(res?.status ?? 0);
      const rawBody = typeof body === 'string' ? body : undefined;

      throw new HttpError(status || 0, url, {
        kind: status >= 500 ? 'upstream' : 'client',
        retryAfterSeconds,
        message: rawBody ?? `Upstream error: ${status || 'unknown'}`
      });
    }

    const data = (await res.json()) as any;

    return {
      stars: Number(data.stargazers_count ?? 0),
      forks: Number(data.forks_count ?? 0),
      openIssues: Number(data.open_issues_count ?? 0),
      watchers: Number(data.subscribers_count ?? data.watchers_count ?? 0)
    };
  });
};
