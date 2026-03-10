import {
  getAzureRepoRef,
  type AzureRepoRef
} from '../azure/get-azure-repo-ref';
import {
  getBitbucketRepoRef,
  type BitbucketRepoRef
} from '../bitbucket/get-bitbucket-repo-ref';
import {
  getGitHubRepoRef,
  type GitHubRepoRef
} from '../github/utils/get-github-repo-ref';
import {
  getGitLabRepoRef,
  type GitLabRepoRef
} from '../gitlab/get-gitlab-repo-ref';

export type RepoRef =
  | ({ provider: 'github' } & GitHubRepoRef)
  | ({ provider: 'gitlab' } & GitLabRepoRef)
  | ({ provider: 'bitbucket' } & BitbucketRepoRef)
  | ({ provider: 'azure' } & AzureRepoRef);

export const getRepoRef = (url?: string | null): RepoRef | null =>
  (getGitHubRepoRef(url) && {
    provider: 'github',
    ...getGitHubRepoRef(url)!
  }) ||
  (getGitLabRepoRef(url) && {
    provider: 'gitlab',
    ...getGitLabRepoRef(url)!
  }) ||
  (getBitbucketRepoRef(url) && {
    provider: 'bitbucket',
    ...getBitbucketRepoRef(url)!
  }) ||
  (getAzureRepoRef(url) && { provider: 'azure', ...getAzureRepoRef(url)! }) ||
  null;
