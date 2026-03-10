export type GitLabRepoRef = {
  host: string; // gitlab.com or self-hosted
  fullPath: string; // group/subgroup/repo
};

export const getGitLabRepoRef = (
  repoUrl?: string | null
): GitLabRepoRef | null => {
  if (!repoUrl) return null;

  const raw = repoUrl.trim();
  // SSH scp-like: git@gitlab.com:group/subgroup/repo(.git)
  const scp = raw.match(/^git@([^:]+):(.+?)(?:\.git)?$/i);

  if (scp) {
    const host = scp[1];
    const path = sanitizeRepoPath(scp[2]);

    if (!isGitLabHost(host) || !looksLikeGroupRepo(path)) return null;

    return { host, fullPath: path };
  }

  const cleaned = raw.replace(/^git\+/i, '');

  try {
    const u = new URL(cleaned.replace(/^ssh:\/\/git@/i, 'https://'));
    const host = u.hostname;

    if (!isGitLabHost(host)) return null;

    const parts = u.pathname.split('/').filter(Boolean);

    if (parts.length < 2) return null;

    // GitLab project path may be more than 2 segments (subgroups)
    const fullPath = sanitizeRepoPath(parts.join('/'));

    if (!looksLikeGroupRepo(fullPath)) return null;

    return { host, fullPath };
  } catch {
    return null;
  }
};

const isGitLabHost = (host: string) => {
  const h = host.toLowerCase();

  // allow gitlab.com and gitlab.* (self-hosted convention). tighten if you want only gitlab.com
  return h === 'gitlab.com' || h.startsWith('gitlab.');
};
const looksLikeGroupRepo = (path: string) =>
  path.split('/').filter(Boolean).length >= 2;
const sanitizeRepoPath = (path: string) =>
  path
    .replace(/\.git$/i, '')
    .replace(/#.*$/, '')
    .replace(/^\/+|\/+$/g, '')
    .trim();
