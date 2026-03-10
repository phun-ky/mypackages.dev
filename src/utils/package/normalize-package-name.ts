export const normalizePackageName = (raw: string) =>
  raw.trim().replace(/\s+/g, '').toLowerCase();
