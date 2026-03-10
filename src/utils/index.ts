export const uniqueStrings = (arr: string[]) => [
  ...new Set(arr.filter(Boolean))
];

export const toDateMs = (v: string) => {
  const t = v ? Date.parse(v) : NaN;

  return Number.isFinite(t) ? t : null;
};

export const isAbort = (e: Error) => e?.name === 'AbortError';
