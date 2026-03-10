export const getInitialsForUser = (name?: string): string => {
  const max = 2;

  const cleaned = (name ?? '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'NN';

  const takeFirstLetter = (s: string) =>
    s.trim().match(/[A-Za-zÀ-ÖØ-öø-ÿ]/)?.[0] ?? '';

  // Multiple words => first + last
  const words = cleaned.split(' ').filter(Boolean);
  if (words.length >= 2) {
    const first = takeFirstLetter(words[0]);
    const last = takeFirstLetter(words[words.length - 1]);
    return (first + last).toUpperCase().slice(0, max);
  }

  // Single word: try common username separators
  const single = words[0];
  const parts = single.split(/[._\-]+/).filter(Boolean);

  if (parts.length >= 2) {
    const a = takeFirstLetter(parts[0]);
    const b = takeFirstLetter(parts[1]);
    return (a + b).toUpperCase().slice(0, max);
  }

  // Single continuous token: take first 2 letters (supporting unicode letters)
  const letters = single.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) ?? [];
  return letters.join('').slice(0, max).toUpperCase();
};
