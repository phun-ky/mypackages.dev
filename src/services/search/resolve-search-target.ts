/* eslint-disable no-empty */
import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '../supabase';

export type ResolveResult =
  | { kind: 'package'; packageName: string; registry: 'npm' | 'github' }
  | { kind: 'user'; username: string }
  | { kind: 'search'; q: string };

const isScopedPackage = (q: string) => /^@[^/]+\/[^/]+$/.test(q);
const normalizeQuery = (raw: string) =>
  raw
    .trim()
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/\s*\/\s*/g, '/') // "@scope / name" -> "@scope/name"
    .replace(/^@\s+/, '@'); // "@ scope/name" -> "@scope/name"
const splitScoped = (q: string): { scope: string; name: string } | null => {
  if (!isScopedPackage(q)) return null;

  const m = q.match(/^@([^/]+)\/([^/]+)$/);

  if (!m) return null;

  return { scope: m[1], name: m[2] };
};

export const existsNpmPackage = async (
  packageName: string,
  signal?: AbortSignal
) => {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY.trim()
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token.trim()}`;
  }

  const { data, error } = await supabase.functions.invoke(
    'npm-exists-package',
    {
      body: { packageName },
      headers,
      signal
    }
  );

  if (error) throw new Error(error.message);

  if (!data?.ok) throw new Error(data?.error ?? 'npm-exists-package failed');

  return Boolean(data.exists);
};

const existsGitHubNpmPackage = async (
  packageName: string,
  signal?: AbortSignal
) => {
  // For v1: only attempt if it looks like @org/name
  const parts = splitScoped(packageName);

  if (!parts) return false;

  const { scope: org, name } = parts;
  // GitHub REST: Get a package for an organization
  // GET /orgs/{org}/packages/{package_type}/{package_name}
  // We try "npm" as package_type for GitHub Packages (npm registry).
  const url = `https://api.github.com/orgs/${encodeURIComponent(
    org
  )}/packages/npm/${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  // For now:
  // - 200 => exists
  // - 401/403 => “might exist but needs auth” -> treat as not found for v1
  // - 404 => not found
  return res.ok;
};
const invokeNpmUserHasPackages = async (
  supabase: SupabaseClient,
  body: { mode: 'maintainer' | 'author'; username: string },
  signal?: AbortSignal
) => {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY.trim()
  };

  // Optional auth
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token.trim()}`;
  }

  const { data, error } = await supabase.functions.invoke(
    'npm-user-has-packages',
    { body, headers, signal }
  );

  if (error) throw new Error(error.message);

  if (!data?.ok) throw new Error(data?.error ?? 'npm-user-has-packages failed');

  return Boolean(data.hasPackages);
};

export const checkMaintainerHasPackages = async (
  username: string,
  signal?: AbortSignal
) =>
  invokeNpmUserHasPackages(supabase, { mode: 'maintainer', username }, signal);

export const checkAuthorHasPackages = async (
  username: string,
  signal?: AbortSignal
) => invokeNpmUserHasPackages(supabase, { mode: 'author', username }, signal);

export type ResolveMode = 'auto' | 'package' | 'user';

export const resolveSearchTarget = async (
  raw: string,
  mode: ResolveMode = 'auto',
  signal?: AbortSignal
): Promise<ResolveResult> => {
  const q = normalizeQuery(raw);

  if (!q) return { kind: 'search', q: '' };

  const tryNpm = async (): Promise<ResolveResult | null> => {
    if (await existsNpmPackage(q, signal)) {
      return { kind: 'package', packageName: q, registry: 'npm' };
    }

    return null;
  };
  const tryGitHub = async (): Promise<ResolveResult | null> => {
    // v1: likely 401/404; that's fine
    if (await existsGitHubNpmPackage(q, signal)) {
      return { kind: 'package', packageName: q, registry: 'github' };
    }

    return null;
  };
  const tryUser = async (): Promise<ResolveResult | null> => {
    if (isScopedPackage(q)) return null;

    if (await checkMaintainerHasPackages(q, signal)) {
      return { kind: 'user', username: q };
    }

    if (await checkAuthorHasPackages(q, signal)) {
      return { kind: 'user', username: q };
    }

    return null;
  };

  // Force: package
  if (mode === 'package') {
    try {
      const npm = await tryNpm();

      if (npm) return npm;
    } catch {}

    try {
      const gh = await tryGitHub();

      if (gh) return gh;
    } catch {}

    return { kind: 'search', q };
  }

  // Force: user
  if (mode === 'user') {
    try {
      const u = await tryUser();

      if (u) return u;
    } catch {}

    return { kind: 'search', q };
  }

  // Auto: package first (npm -> github), then user (if not scoped)
  try {
    const npm = await tryNpm();

    if (npm) return npm;
  } catch {}

  try {
    const gh = await tryGitHub();

    if (gh) return gh;
  } catch {}

  if (isScopedPackage(q)) return { kind: 'search', q };

  try {
    const u = await tryUser();

    if (u) return u;
  } catch {}

  return { kind: 'search', q };
};
