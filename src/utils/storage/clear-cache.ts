import { DEFAULT_OPTIONS } from '../../config';

/** Removes every entry the site cached, under its prefix. */
export const clearCache = () => {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(DEFAULT_OPTIONS.cachePrefix))
    .forEach((k) => localStorage.removeItem(k));
};
