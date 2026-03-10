export type RepoProvider = 'github' | 'gitlab' | 'bitbucket' | 'azure';

export type RepoStats = {
  provider: RepoProvider;
  stars?: number; // GitHub/GitLab; Bitbucket maps to watchers if you want
  forks?: number; // all except Azure (not really exposed as a single number)
  watchers?: number; // GitHub/Bitbucket
  openIssues?: number; // GitHub/GitLab/Bitbucket (if enabled/public)
  updatedAt?: string; // ISO
};
