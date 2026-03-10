export const handleQueryTermToUseEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    const t = e.target;

    if (t instanceof HTMLInputElement) t.value = '';
  }
};
