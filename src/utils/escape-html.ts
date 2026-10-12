// Use these for every value that doesn't come from this code base, like data
// from npm, GitHub, OSV, Supabase or the URL, before putting it in a template
// string.
//
// Pages are rendered by diff-dom, whose parser only decodes `&amp;`, `&lt;`
// and `&gt;` in text, and nothing in attribute values. So text and attribute
// values are escaped differently, and only as much as needed to keep markup
// out. Both are also correct for `innerHTML`.

/**
 * Escapes a value for use as text between tags.
 *
 * @example
 * ```ts
 * html`<p class="description">${escapeHtml(details.description)}</p>`;
 * ```
 */
export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

/**
 * Escapes a value for use in a double-quoted attribute value. A `"` can't end
 * the value early; `&` is left as is, so URLs keep their query strings.
 *
 * @example
 * ```ts
 * html`<span title="${escapeAttr(status.title)}"></span>`;
 * ```
 */
export const escapeAttr = (value: unknown): string =>
  String(value ?? '').replaceAll('"', '&quot;');

/**
 * Returns an absolute http(s) URL, or `undefined` for anything else, like a
 * `javascript:` URL in a package's `homepage`. Escape the result with
 * `escapeAttr` before putting it in an attribute.
 */
export const safeUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;

  try {
    const url = new URL(value);

    return url.protocol === 'https:' || url.protocol === 'http:'
      ? value
      : undefined;
  } catch {
    return undefined;
  }
};
