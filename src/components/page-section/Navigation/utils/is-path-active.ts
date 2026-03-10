import { normalizePath } from './normalize-path';

export const isPathActive = (itemPath: string, currentPath: string) => {
  const path = normalizePath(itemPath);
  const current = normalizePath(currentPath);
  return current === path || current.startsWith(path + '/');
};
