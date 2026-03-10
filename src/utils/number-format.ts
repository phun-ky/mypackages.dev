export const numberFormat = new Intl.NumberFormat(navigator.language);

export const compactNumberFormat = new Intl.NumberFormat(navigator.language, {
  notation: 'compact',
  compactDisplay: 'short'
});
