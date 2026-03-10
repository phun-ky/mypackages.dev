export type AzureRepoRef = {
  org: string;
  project: string;
  repo: string;
};

export const getAzureRepoRef = (
  repoUrl?: string | null
): AzureRepoRef | null => {
  if (!repoUrl) return null;

  const raw = repoUrl.trim();
  // SSH scp-like: git@ssh.dev.azure.com:v3/org/project/repo
  const scp = raw.match(
    /^git@ssh\.dev\.azure\.com:v3\/([^/]+)\/([^/]+)\/(.+)$/i
  );

  if (scp) {
    return { org: scp[1], project: scp[2], repo: sanitizeRepoName(scp[3]) };
  }

  const cleaned = raw.replace(/^git\+/i, '');

  try {
    const normalizedForUrl = cleaned
      .replace(/^ssh:\/\/git@/i, 'https://')
      .replace(/^git:\/\//i, 'https://');
    const u = new URL(normalizedForUrl);
    const host = u.hostname.toLowerCase();

    // dev.azure.com/org/project/_git/repo
    if (host === 'dev.azure.com') {
      const parts = u.pathname.split('/').filter(Boolean);

      // [org, project, _git, repo]
      if (parts.length >= 4 && parts[2] === '_git') {
        return {
          org: parts[0],
          project: parts[1],
          repo: sanitizeRepoName(parts[3])
        };
      }

      return null;
    }

    // ssh.dev.azure.com/v3/org/project/repo  (in case someone pasted https form)
    if (host === 'ssh.dev.azure.com') {
      const parts = u.pathname.split('/').filter(Boolean);

      // [v3, org, project, repo]
      if (parts.length >= 4 && parts[0] === 'v3') {
        return {
          org: parts[1],
          project: parts[2],
          repo: sanitizeRepoName(parts[3])
        };
      }

      return null;
    }

    // org.visualstudio.com/project/_git/repo
    if (host.endsWith('.visualstudio.com')) {
      const org = host.split('.')[0];
      const parts = u.pathname.split('/').filter(Boolean);

      // [project, _git, repo]
      if (parts.length >= 3 && parts[1] === '_git') {
        return {
          org,
          project: parts[0],
          repo: sanitizeRepoName(parts[2])
        };
      }

      return null;
    }

    return null;
  } catch {
    return null;
  }
};

const sanitizeRepoName = (repo: string) =>
  repo
    .replace(/\.git$/i, '')
    .replace(/#.*$/, '')
    .trim();
