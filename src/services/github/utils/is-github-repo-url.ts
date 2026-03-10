import type { NpmRepository } from '../../../types';

/**
 * Returns true if `repoUrl` looks like a GitHub repo URL (owner/repo),
 * supporting common formats:
 * - https://github.com/owner/repo(.git)
 * - git+https://github.com/owner/repo(.git)
 * - ssh://git@github.com/owner/repo(.git)
 * - git@github.com:owner/repo(.git)
 */
export const isGitHubRepoUrl = (raw?: NpmRepository | string): boolean => {
  if (!raw) return false;

  const rawUrl = typeof raw === 'string' ? raw : (raw as { url: string }).url; // tolerate {url:"..."}
  const repoUrl = rawUrl.trim();

  // SCP-like SSH: git@github.com:owner/repo(.git)
  if (/^git@github\.com:[^/]+\/[^/]+(?:\.git)?$/i.test(repoUrl)) return true;

  const cleaned = repoUrl.replace(/^git\+/i, '');

  try {
    const u = new URL(cleaned);
    // allow common git-ish protocols
    const protoOk = ['http:', 'https:', 'ssh:', 'git:'].includes(u.protocol);

    if (!protoOk) return false;

    if (u.hostname.toLowerCase() !== 'github.com') return false;

    const parts = u.pathname.split('/').filter(Boolean);

    if (parts.length < 2) return false;

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, '');

    if (!owner || !repo) return false;

    return true;
  } catch {
    return false;
  }
};
