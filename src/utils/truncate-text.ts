export const truncateText = (s: string, max = 4000) =>
  s.length > max ? s.slice(0, max) + '\n…(truncated)' : s;
