import type { RouterMatch, Route } from '../../types';

export const potentialMatchesMapper = (route: Route): RouterMatch => {
  // javascript, i'm looking at you!!
  const pathName = decodeURI(location.pathname) + '';

  return {
    route: route,
    result: route.regex ? pathName.match(route.regex) : null
  };
};
