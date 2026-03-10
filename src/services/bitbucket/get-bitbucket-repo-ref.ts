export type BitbucketRepoRef = {
  workspace: string;
  repo: string;
};

export const getBitbucketRepoRef = (
  repoUrl?: string | null
): BitbucketRepoRef | null => {
  if (!repoUrl) return null;

  const raw = repoUrl.trim();
  // SSH scp-like: git@bitbucket.org:workspace/repo(.git)
  const scp = raw.match(/^git@bitbucket\.org:([^/]+)\/(.+?)(?:\.git)?$/i);

  if (scp) return { workspace: scp[1], repo: sanitizeRepoName(scp[2]) };

  const cleaned = raw.replace(/^git\+/i, '');

  try {
    const u = new URL(cleaned.replace(/^ssh:\/\/git@/i, 'https://'));

    if (u.hostname.toLowerCase() !== 'bitbucket.org') return null;

    const parts = u.pathname.split('/').filter(Boolean);

    if (parts.length < 2) return null;

    const workspace = parts[0];
    const repo = sanitizeRepoName(parts[1]);

    if (!workspace || !repo) return null;

    return { workspace, repo };
  } catch {
    return null;
  }
};

const sanitizeRepoName = (repo: string) =>
  repo
    .replace(/\.git$/i, '')
    .replace(/#.*$/, '')
    .trim();
