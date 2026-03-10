export const normalizePath = (p: string) =>
  // remove trailing slash except root
  p.length > 1 ? p.replace(/\/+$/, '') : p;
