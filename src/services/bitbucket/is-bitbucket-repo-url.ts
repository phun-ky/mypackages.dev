export const isBitbucketRepoUrl = (raw: string): boolean => {
  try {
    const s = raw
      .replace(/^git\+/, '')
      .replace(/^git@([^:]+):/, 'https://$1/')
      .replace(/^ssh:\/\/git@/, 'https://')
      .replace(/^git:\/\//, 'https://')
      .replace(/^git@/, 'https://');
    const u = new URL(s);
    const host = u.hostname.toLowerCase();
    const isBb = host === 'bitbucket.org';
    const parts = u.pathname
      .replace(/\.git$/, '')
      .split('/')
      .filter(Boolean);

    return isBb && parts.length >= 2;
  } catch {
    return false;
  }
};
