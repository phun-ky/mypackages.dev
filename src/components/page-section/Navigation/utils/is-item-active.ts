import type { NavigationItem } from '..';
import { isPathActive } from './is-path-active';

export const isItemActive = (
  item: NavigationItem,
  currentPath: string
): boolean => {
  const selfActive = item.path ? isPathActive(item.path, currentPath) : false;
  const childActive = Boolean(
    item.children?.some((c) => isItemActive(c, currentPath))
  );
  return selfActive || childActive;
};
