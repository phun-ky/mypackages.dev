/**
 * Pages built in the Nebula, refined design (#47). They bring their own
 * header and notices, so the app leaves out the old header, side navigation
 * and banners, and lays them out full-bleed (see `.nebula-page` in app.css).
 * Add a page here when it's redesigned.
 */
export const NEBULA_PAGES: ReadonlySet<string> = new Set([
  'StartPage',
  'UserPage',
  'PackagePage'
]);
