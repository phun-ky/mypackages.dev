/* eslint-disable @typescript-eslint/no-unused-vars */
import { fetchAzureRepoStats } from '../azure/fetch-azure-repo-stats';
import { isAzureDevOpsRepoUrl } from '../azure/is-azure-repo-url';
import { fetchBitbucketRepoStats } from '../bitbucket/fetch-bitbucket-repo-stats';
import { isBitbucketRepoUrl } from '../bitbucket/is-bitbucket-repo-url';
import { fetchGitHubRepoStats } from '../github/stars';
import { isGitHubRepoUrl } from '../github/utils/is-github-repo-url';
import { fetchGitLabRepoStats } from '../gitlab/fetch-gitlab-repo-stats';
import { isGitLabRepoUrl } from '../gitlab/is-gitlab-repo-url';

import type { RepoStats } from './types';

export type FetchRepoStatsParamsType = {
  repoUrl?: string | null;
  token?: string;
  signal?: AbortSignal;
};

export const fetchRepoStats = async (
  props: FetchRepoStatsParamsType
): Promise<RepoStats | null> => {
  const { repoUrl } = props;

  if (!repoUrl) return null;

  if (isGitHubRepoUrl(repoUrl)) {
    return await fetchGitHubRepoStats(props).then((r) =>
      r ? { provider: 'github', ...r } : null
    );
  }

  if (isGitLabRepoUrl(repoUrl)) {
    try {
      return await fetchGitLabRepoStats(props);
    } catch (e) {
      return null;
    }
  }

  if (isBitbucketRepoUrl(repoUrl)) {
    try {
      return await fetchBitbucketRepoStats(props);
    } catch (e) {
      return null;
    }
  }

  if (isAzureDevOpsRepoUrl(repoUrl)) {
    return await fetchAzureRepoStats(props);
  }

  return null;
};
