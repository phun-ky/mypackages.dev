export const isGitLabRepoUrl = (raw: string): boolean => {
  // Accept gitlab.com and self-hosted gitlab.* (optional).
  // If you ONLY want gitlab.com, replace the hostname check accordingly.
  try {
    const s = raw
      .replace(/^git\+/, '')
      .replace(/^git@([^:]+):/, 'https://$1/')
      .replace(/^ssh:\/\/git@/, 'https://')
      .replace(/^git:\/\//, 'https://')
      .replace(/^git@/, 'https://');
    const u = new URL(s);
    const host = u.hostname.toLowerCase();
    const isGitLab = host === 'gitlab.com' || host.startsWith('gitlab.');
    // Must look like /group/project (>=2 segments)
    const parts = u.pathname
      .replace(/\.git$/, '')
      .split('/')
      .filter(Boolean);

    return isGitLab && parts.length >= 2;
  } catch {
    return false;
  }
};
