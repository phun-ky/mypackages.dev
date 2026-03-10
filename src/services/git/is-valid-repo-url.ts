import { isAzureDevOpsRepoUrl } from '../azure/is-azure-repo-url';
import { isBitbucketRepoUrl } from '../bitbucket/is-bitbucket-repo-url';
import { isGitHubRepoUrl } from '../github/utils/is-github-repo-url';
import { isGitLabRepoUrl } from '../gitlab/is-gitlab-repo-url';

export const isValidRepoUrl = (repoUrl?: string) => {
  if (!repoUrl) return false;

  return (
    isGitHubRepoUrl(repoUrl) ||
    isBitbucketRepoUrl(repoUrl) ||
    isGitLabRepoUrl(repoUrl) ||
    isAzureDevOpsRepoUrl(repoUrl)
  );
};
