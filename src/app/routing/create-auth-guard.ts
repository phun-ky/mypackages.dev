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

export const createAuthGuard =
  ({
    match,
    session
  }: {
    match: string | RouterMatch | undefined;
    session: Session | null;
  }) =>
  async () => {
    const isAuthed = Boolean(session);
    const routeIsPublic = isRoutePublic(match);

    if (match && typeof match !== 'string') {
      if (!routeIsPublic && !isAuthed) {
        const returnTo = getReturnTo();

        // avoid infinite loop if already on the signin page
        if (!window.location.pathname.startsWith('/dashboard/signin')) {
          const next = `/dashboard/signin?returnTo=${encodeURIComponent(returnTo)}`;

          // important: stop current render and route instead
          await navigateTo(next);
        }
      }
    }
  };
