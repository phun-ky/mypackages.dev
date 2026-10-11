/* eslint-disable @stylistic/indent */
import type { Session } from '@supabase/supabase-js';

import type { RouterMatch } from '/lib/spa/types';
import { navigateTo } from '/lib/spa/utils/navigate-to';

const isRoutePublic = (match: string | RouterMatch | undefined) => {
  if (!match) return true;

  if (typeof match === 'string') return false;

  return Boolean(match.route?.public);
};
const getReturnTo = () =>
  window.location.pathname + window.location.search + window.location.hash;

/**
 * Whether the matched route is private and there is no session. Such pages
 * are not loaded at all, since they fail without a session, and the auth
 * guard redirects to sign in instead.
 */
export const requiresSignIn = ({
  match,
  session
}: {
  match: string | RouterMatch | undefined;
  session: Session | null;
}) =>
  Boolean(match) &&
  typeof match !== 'string' &&
  !isRoutePublic(match) &&
  !session;

export const createAuthGuard =
  ({
    match,
    session
  }: {
    match: string | RouterMatch | undefined;
    session: Session | null;
  }) =>
  async () => {
    if (requiresSignIn({ match, session })) {
      const returnTo = getReturnTo();

      // avoid infinite loop if already on the signin page
      if (!window.location.pathname.startsWith('/dashboard/signin')) {
        const next = `/dashboard/signin?returnTo=${encodeURIComponent(returnTo)}`;

        // important: stop current render and route instead
        await navigateTo(next);
      }
    }
  };
