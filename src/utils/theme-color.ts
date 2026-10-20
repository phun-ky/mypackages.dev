/**
 * Returns a colour token from `src/styles/variables.css` as `rgba()`, for
 * code that can't use CSS, like Highcharts options. Read when called, so it
 * follows the theme the page has then.
 *
 * Highcharts parses colours itself (for gradients and hover states) and only
 * understands the comma syntax, so this returns `rgba(r, g, b, a)`.
 *
 * @param name - The token without its prefix, like `brand` for `--rgb-brand`.
 * @param alpha - Opacity from 0 to 1.
 * @returns The colour, in the comma syntax: red, green, blue and alpha.
 * @throws {RangeError} If the token doesn't exist or `alpha` is out of range.
 */
export const themeColor = (name: string, alpha = 1): string => {
  if (!(alpha >= 0 && alpha <= 1)) {
    throw new RangeError(`alpha must be between 0 and 1, got ${alpha}`);
  }

  const channels = getComputedStyle(document.documentElement)
    .getPropertyValue(`--rgb-${name}`)
    .trim()
    .split(/\s+/);

  if (channels.length !== 3) {
    throw new RangeError(`No colour token named --rgb-${name}`);
  }

  return `rgba(${channels.join(', ')}, ${alpha})`;
};
