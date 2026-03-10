export type GitHubRepoRef = {
  owner: string;
  repo: string;
};

/**
 * Extract {owner, repo} from common GitHub URL formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - git+https://github.com/owner/repo.git
 * - git@github.com:owner/repo.git
 * - ssh://git@github.com/owner/repo.git
 */
export const getGitHubRepoRef = (
  repoUrl?: string | null
): GitHubRepoRef | null => {
  if (!repoUrl) return null;

  const raw = repoUrl.trim();
  // SSH form: git@github.com:owner/repo(.git)
  const sshMatch = raw.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/i);

  if (sshMatch)
    return { owner: sshMatch[1], repo: sanitizeRepoName(sshMatch[2]) };

  // Normalize git+ prefix
  const cleaned = raw.replace(/^git\+/i, '');

  // Try URL parsing (https://, ssh://, git://)
  try {
    const u = new URL(cleaned);

    if (!/github\.com$/i.test(u.hostname)) return null;

    // Path: /owner/repo/...
    const parts = u.pathname.split('/').filter(Boolean);

    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = sanitizeRepoName(parts[1]);

    if (!owner || !repo) return null;

    return { owner, repo };
  } catch {
    return null;
  }
};

const sanitizeRepoName = (repo: string) =>
  repo
    .replace(/\.git$/i, '')
    .replace(/#.*$/, '')
    .trim();
