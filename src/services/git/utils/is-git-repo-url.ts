/**
 * Returns true if `repoUrl` looks like a git repo URL (owner/repo),
 * supporting common https/git/ssh formats.
 */
export const isGitRepoUrl = (repoUrl?: string | null): boolean => {
  if (!repoUrl) return false;

  const raw = repoUrl.trim();

  if (!raw) return false;

  // git@host:owner/repo(.git)
  if (/^git@[^:]+:[^/]+\/[^/]+(?:\.git)?$/i.test(raw)) return true;

  // normalize git+https://...
  const cleaned = raw.replace(/^git\+/i, '');

  try {
    const u = new URL(cleaned);
    // allow common git protocols
    const protoOk = ['http:', 'https:', 'ssh:', 'git:'].includes(u.protocol);

    if (!protoOk) return false;

    // must have /owner/repo in path
    const parts = u.pathname.split('/').filter(Boolean);

    if (parts.length < 2) return false;

    // reject obvious non-repo paths
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, '');

    if (!owner || !repo) return false;

    return true;
  } catch {
    return false;
  }
};
