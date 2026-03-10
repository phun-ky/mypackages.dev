import type { Route, RouterMatch, Routes } from '../../../../lib/spa/types';
import { breadcrumbMetaByPath, type BreadcrumbMeta } from './meta';

export type BreadcrumbItem = {
  id: string;
  label: string;
  href: string;
  isCurrent: boolean;
  icon?: string;
  className?: string;
  menu?: Array<{ label: string; href: string }>;
};

const PARAM_RE = /:([A-Za-z0-9_]+)/g;

const interpolate = (path: string, params: Record<string, any>) =>
  path.replace(PARAM_RE, (_, k: string) => String(params[k]));

const requiredParams = (path: string) =>
  Array.from(path.matchAll(PARAM_RE)).map((m) => m[1]);

const canResolve = (path: string, params: Record<string, any>) =>
  requiredParams(path).every((k) => params[k] != null && `${params[k]}` !== '');

const resolveLabel = (route: Route, params: Record<string, any>) => {
  const meta = route.path ? breadcrumbMetaByPath[route.path] : undefined;
  const l = meta?.label ?? route.name;
  return typeof l === 'function' ? l(params) : l;
};

const isPublicForUser = (route: Route | undefined, isAuthed: boolean) => {
  if (!route) return false;
  if (route.public === false) return isAuthed;
  return true; // public true or undefined => treat as public
};

const resolveMenuEntry = (
  entry: any,
  params: Record<string, any>
): { href: string; label?: string } | null => {
  if (!entry) return null;

  // object form
  if (typeof entry === 'object' && 'href' in entry && 'label' in entry) {
    const href =
      typeof entry.href === 'function' ? entry.href(params) : entry.href;
    return { href, label: entry.label };
  }

  // function form => href
  if (typeof entry === 'function') return { href: entry(params) };

  // string form => href
  if (typeof entry === 'string') return { href: entry };

  return null;
};
export const crumbIdFromHref = (href: string) => {
  // deterministic "hash" (djb2-ish) -> base36
  let h = 5381;
  for (let i = 0; i < href.length; i++) h = (h * 33) ^ href.charCodeAt(i);
  const hash = (h >>> 0).toString(36);
  return `crumb-${hash}`;
};
export const getBreadcrumbsFromRoutes = (args: {
  routes: Routes;
  match?: RouterMatch;
  params: Record<string, any>;
  isAuthed: boolean;
  withMenus?: boolean;
  skipUnresolvable?: boolean;
}): BreadcrumbItem[] => {
  const {
    routes,
    match,
    params,
    isAuthed,
    withMenus = true,
    skipUnresolvable = true
  } = args;

  if (!match) return [];
  const current = match.route;
  if (!current?.path) return [];

  // index routes by path
  const byPath = new Map<string, Route>();
  for (const r of routes) {
    if (r.path) byPath.set(r.path, r);
  }

  // build chain current -> parent -> ... (using meta)
  const chain: Route[] = [];
  let cursor: Route | undefined = current;

  while (cursor?.path) {
    // auth filter
    if (isPublicForUser(cursor, isAuthed)) {
      chain.push(cursor);
    }

    const parentPath = (
      breadcrumbMetaByPath[cursor.path] as BreadcrumbMeta | undefined
    )?.parent as string | undefined;
    cursor = parentPath ? byPath.get(parentPath) : undefined;
  }

  chain.reverse();

  // Build final crumb list
  const out: BreadcrumbItem[] = [];

  for (let i = 0; i < chain.length; i++) {
    const r = chain[i];
    const isCurrent = i === chain.length - 1;

    // param resolvability
    const resolvable = canResolve(r.path!, params);
    if (!resolvable && skipUnresolvable) continue;

    const href = resolvable ? interpolate(r.path!, params) : r.path!;
    const label = resolveLabel(r, params);

    let icon;
    let className;

    // menus
    let menu: BreadcrumbItem['menu'] | undefined;
    if (withMenus) {
      const meta = breadcrumbMetaByPath[r.path!];
      icon = meta?.icon;
      className = meta?.className;
      if (meta?.menu?.length) {
        const items = meta.menu
          .map((entry) => resolveMenuEntry(entry, params))
          .filter(Boolean)
          .map((m) => {
            const href = m!.href;

            // If menu href matches a route.path exactly, use that route's label
            const routeForHref = byPath.get(href);
            if (routeForHref && !isPublicForUser(routeForHref, isAuthed)) {
              return null; // hide private menu entries
            }

            const menuLabel =
              m!.label ??
              (routeForHref ? resolveLabel(routeForHref, params) : 'Open');

            return { href, label: menuLabel };
          })
          .filter(Boolean) as Array<{ href: string; label: string }>;

        if (items.length) menu = items;
      }
    }

    out.push({
      id: crumbIdFromHref(href),
      label,
      href,
      isCurrent,
      menu,
      icon,
      className
    });
  }

  // Ensure at least current crumb (even if private filtering removed parents)
  if (!out.length && isPublicForUser(current, isAuthed)) {
    return [
      {
        id: 'crumb-start',
        label: resolveLabel(current, params),
        href: location.pathname,
        isCurrent: true
      }
    ];
  }

  return out;
};
