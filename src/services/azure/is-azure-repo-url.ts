export const isAzureDevOpsRepoUrl = (raw: string): boolean => {
  if (!raw) return false;

  const s = raw
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    // scp-like to https-ish for parsing
    .replace(/^git@ssh\.dev\.azure\.com:v3\//, 'https://ssh.dev.azure.com/v3/')
    .replace(/^ssh:\/\/git@/, 'https://')
    .replace(/^git:\/\//, 'https://')
    .replace(/^git@([^:]+):/, 'https://$1/');

  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase();
    const isDevAzure = host === 'dev.azure.com' || host === 'ssh.dev.azure.com';
    const isVs = host.endsWith('.visualstudio.com');

    if (!isDevAzure && !isVs) return false;

    const path = u.pathname.replace(/\/+$/, '');

    // dev.azure.com/{org}/{project}/_git/{repo}
    if (host === 'dev.azure.com') {
      const parts = path.split('/').filter(Boolean);

      // [org, project, _git, repo]
      return parts.length >= 4 && parts[2] === '_git' && Boolean(parts[3]);
    }

    // ssh.dev.azure.com/v3/{org}/{project}/{repo}
    if (host === 'ssh.dev.azure.com') {
      const parts = path.split('/').filter(Boolean);

      // [v3, org, project, repo]
      return parts.length >= 4 && parts[0] === 'v3' && Boolean(parts[3]);
    }

    // {org}.visualstudio.com/{project}/_git/{repo}
    if (isVs) {
      const parts = path.split('/').filter(Boolean);

      // [project, _git, repo]
      return parts.length >= 3 && parts[1] === '_git' && Boolean(parts[2]);
    }

    return false;
  } catch {
    return false;
  }
};
