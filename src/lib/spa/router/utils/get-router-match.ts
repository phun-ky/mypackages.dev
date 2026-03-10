import type { RouterMatch, Routes } from '../../types';

import { potentialMatchesMapper } from './potential-matches-mapper';

export const getRouterMatch = (routes: Routes): RouterMatch => {
  // Test each route for a potential match.
  const potentialMatches = routes.map(potentialMatchesMapper);

  let match = potentialMatches.find(
    (potentialMatch: RouterMatch) => potentialMatch.result !== null
  ) as RouterMatch;

  if (!match) {
    // javascript, i'm looking at you!!
    const pathName = decodeURI(location.pathname) + '';

    match = {
      route: { path: '/404', page: 'PageNotFoundPage', name: 'Page not found' },
      result: [pathName]
    };
  }

  return match;
};
