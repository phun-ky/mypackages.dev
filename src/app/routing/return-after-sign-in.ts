/* eslint-disable @stylistic/indent */
import type { Session } from '@supabase/supabase-js';

import { navigateTo } from '/lib/spa/utils/navigate-to';

// GitHub sign-in always comes back to `/` (see signInWithGitHub), so the page
// to go to next is kept for this tab until there is a session
const RETURN_TO_KEY = 'sign-in:returnTo';
// Only paths on this site, so a `returnTo` in a link can't send anyone away
const isLocalPath = (path: string | null): path is string => {
  if (!path?.startsWith('/')) return false;

  try {
    return (
      new URL(path, window.location.origin).origin === window.location.origin
    );
  } catch {
    return false;
  }
};

/**
 * Where to go after signing in: the `returnTo` the auth guard gives the sign
 * in and sign up pages, or else the page sign-in started on.
 */
export const getPathAfterSignIn = () => {
  const { pathname, search, hash } = window.location;

  if (
    pathname.startsWith('/dashboard/signin') ||
    pathname.startsWith('/dashboard/signup')
  ) {
    const returnTo = new URLSearchParams(search).get('returnTo');

    return isLocalPath(returnTo) ? returnTo : '/dashboard';
  }

  return pathname + search + hash;
};

export const rememberPathAfterSignIn = (path: string) => {
  try {
    sessionStorage.setItem(RETURN_TO_KEY, path);
  } catch {
    // Without storage, signing in still works and ends on `/`
  }
};

/**
 * After a render, goes to the page remembered when sign-in started, once
 * there is a session. The path is used once: a cancelled sign-in leaves no
 * session, and the path is dropped.
 */
export const createReturnAfterSignIn =
  ({ session }: { session: Session | null }) =>
  async () => {
    let path: string | null;

    try {
      path = sessionStorage.getItem(RETURN_TO_KEY);
      sessionStorage.removeItem(RETURN_TO_KEY);
    } catch {
      return;
    }

    if (session && isLocalPath(path)) await navigateTo(path);
  };
