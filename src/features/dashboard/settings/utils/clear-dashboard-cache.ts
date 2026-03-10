import { DEFAULT_OPTIONS } from '/config';

export const clearDashboardCache = () => {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(DEFAULT_OPTIONS.cachePrefix))
    .forEach((k) => localStorage.removeItem(k));
};
