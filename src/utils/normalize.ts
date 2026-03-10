/* eslint-disable import/no-unused-modules */
import { isAzureDevOpsRepoUrl } from '../services/azure/is-azure-repo-url';
import { isBitbucketRepoUrl } from '../services/bitbucket/is-bitbucket-repo-url';
import { isGitHubRepoUrl } from '../services/github/utils/is-github-repo-url';
import { isGitLabRepoUrl } from '../services/gitlab/is-gitlab-repo-url';
import type {
  PackageLicense,
  PackageLicenseNameObject,
  PackageLicenseTypeObject
} from '../types';

export const normalizeLicense = (
  license: PackageLicense
): string | null | undefined => {
  if (!license) return null;

  if (typeof license === 'string') return license;

  if (typeof license === 'object') {
    if (typeof (license as PackageLicenseTypeObject).type === 'string')
      return (license as PackageLicenseTypeObject).type;

    if (typeof (license as PackageLicenseNameObject).name === 'string')
      return (license as PackageLicenseNameObject).name;
  }

  return null;
};

export const normalizeGithubRepoUrl = (raw: unknown) => {
  if (!raw) return undefined;

  const rawUrl = typeof raw === 'string' ? raw : (raw as { url: string }).url; // tolerate {url:"..."}

  if (!rawUrl) return undefined;

  if (!isGitHubRepoUrl(rawUrl)) return undefined;

  let url = rawUrl.replace(/^git\+/, '').replace(/\.git$/, '');

  if (url.startsWith('git@github.com:'))
    url = url.replace('git@github.com:', 'https://github.com/');

  url = url
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\/git@/, 'https://')
    .replace(/^git@/, 'https://');

  return url.startsWith('https://') ? url : undefined;
};

export const normalizeGitLabRepoUrl = (raw: unknown): string | undefined => {
  if (!raw) return undefined;

  const rawUrl = typeof raw === 'string' ? raw : (raw as { url?: string })?.url;

  if (!rawUrl) return undefined;

  if (!isGitLabRepoUrl(rawUrl)) return undefined;

  let url = rawUrl.replace(/^git\+/, '').replace(/\.git$/, '');

  // scp-like ssh: git@gitlab.com:group/project
  if (/^git@gitlab\.com:/.test(url)) {
    url = url.replace('git@gitlab.com:', 'https://gitlab.com/');
  } else if (/^git@[^:]+:/.test(url)) {
    // git@<host>:group/project -> https://<host>/group/project
    url = url.replace(/^git@([^:]+):/, 'https://$1/');
  }

  url = url
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\/git@/, 'https://')
    .replace(/^git@/, 'https://');

  // Some gitlab urls can include extra path like /-/… (keep it if present)
  return url.startsWith('https://') ? url : undefined;
};

export const normalizeBitbucketRepoUrl = (raw: unknown): string | undefined => {
  if (!raw) return undefined;

  const rawUrl = typeof raw === 'string' ? raw : (raw as { url?: string })?.url;

  if (!rawUrl) return undefined;

  if (!isBitbucketRepoUrl(rawUrl)) return undefined;

  let url = rawUrl.replace(/^git\+/, '').replace(/\.git$/, '');

  // scp-like ssh: git@bitbucket.org:workspace/repo
  if (url.startsWith('git@bitbucket.org:')) {
    url = url.replace('git@bitbucket.org:', 'https://bitbucket.org/');
  } else if (/^git@[^:]+:/.test(url)) {
    url = url.replace(/^git@([^:]+):/, 'https://$1/');
  }

  url = url
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\/git@/, 'https://')
    .replace(/^git@/, 'https://');

  return url.startsWith('https://') ? url : undefined;
};

export const normalizeAzureDevOpsRepoUrl = (
  raw: unknown
): string | undefined => {
  if (!raw) return undefined;

  const rawUrl = typeof raw === 'string' ? raw : (raw as { url?: string })?.url;

  if (!rawUrl) return undefined;

  if (!isAzureDevOpsRepoUrl(rawUrl)) return undefined;

  let url = rawUrl.replace(/^git\+/, '').replace(/\.git$/, '');

  // git@ssh.dev.azure.com:v3/org/project/repo  -> https://dev.azure.com/org/project/_git/repo
  if (url.startsWith('git@ssh.dev.azure.com:v3/')) {
    const rest = url.replace('git@ssh.dev.azure.com:v3/', '');
    const [org, project, repo] = rest.split('/').filter(Boolean);

    if (org && project && repo) {
      return `https://dev.azure.com/${org}/${project}/_git/${repo}`;
    }

    return undefined;
  }

  // ssh://git@ssh.dev.azure.com/v3/org/project/repo -> https://dev.azure.com/org/project/_git/repo
  if (url.startsWith('ssh://git@ssh.dev.azure.com/v3/')) {
    const rest = url.replace('ssh://git@ssh.dev.azure.com/v3/', '');
    const [org, project, repo] = rest.split('/').filter(Boolean);

    if (org && project && repo) {
      return `https://dev.azure.com/${org}/${project}/_git/${repo}`;
    }

    return undefined;
  }

  // Normalize to https for the remaining forms
  url = url
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\/git@/, 'https://')
    .replace(/^git@/, 'https://');

  // Strip username prefix: https://org@dev.azure.com/org/project/_git/repo
  // URL() will keep username separately; easiest is to parse & rebuild.
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();

    // Already canonical dev.azure.com path
    if (host === 'dev.azure.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      const org = parts[0];
      const project = parts[1];
      const gitTokenIdx = parts.indexOf('_git');
      const repo = gitTokenIdx >= 0 ? parts[gitTokenIdx + 1] : undefined;

      if (org && project && repo) {
        return `https://dev.azure.com/${org}/${project}/_git/${repo}`;
      }

      return undefined;
    }

    // visualstudio.com form: https://{org}.visualstudio.com/{project}/_git/{repo}
    if (host.endsWith('.visualstudio.com')) {
      const org = host.split('.')[0];
      const parts = u.pathname.split('/').filter(Boolean);
      const project = parts[0];
      const repo = parts[2];

      if (org && project && repo && parts[1] === '_git') {
        return `https://dev.azure.com/${org}/${project}/_git/${repo}`;
      }

      return undefined;
    }

    // ssh.dev.azure.com/v3/org/project/repo -> canonical dev.azure.com
    if (host === 'ssh.dev.azure.com') {
      const parts = u.pathname.split('/').filter(Boolean);

      if (parts[0] === 'v3') {
        const org = parts[1];
        const project = parts[2];
        const repo = parts[3];

        if (org && project && repo) {
          return `https://dev.azure.com/${org}/${project}/_git/${repo}`;
        }
      }

      return undefined;
    }

    return undefined;
  } catch {
    return undefined;
  }
};

export const normalizeKnownRepoUrl = (raw: unknown) =>
  normalizeGithubRepoUrl(raw) ??
  normalizeGitLabRepoUrl(raw) ??
  normalizeBitbucketRepoUrl(raw) ??
  normalizeAzureDevOpsRepoUrl(raw);
