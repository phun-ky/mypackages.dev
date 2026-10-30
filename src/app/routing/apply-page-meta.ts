import { ORIGIN, type PageMeta } from './page-meta';

const upsert = (selector: string, create: () => HTMLElement) =>
  document.head.querySelector<HTMLElement>(selector) ??
  document.head.appendChild(create());
const meta = (attr: 'name' | 'property', key: string, content: string) => {
  upsert(`meta[${attr}="${key}"]`, () => {
    const el = document.createElement('meta');

    el.setAttribute(attr, key);

    return el;
  }).setAttribute('content', content);
};

/**
 * Sets the page's title, description, canonical URL and link preview tags,
 * as the build writes them into the prerendered pages (#40), for pages the
 * router renders after the first.
 */
export const applyPageMeta = (page: PageMeta) => {
  const url = page.path === null ? null : `${ORIGIN}${page.path}`;

  document.title = page.title;
  meta('name', 'description', page.description);
  meta('property', 'og:title', page.title);
  meta('property', 'og:description', page.description);

  if (url) meta('property', 'og:url', url);
  else document.head.querySelector('meta[property="og:url"]')?.remove();

  meta('name', 'twitter:title', page.title);
  meta('name', 'twitter:description', page.description);

  if (page.noindex || !url) {
    meta('name', 'robots', 'noindex');
    document.head.querySelector('link[rel="canonical"]')?.remove();
  } else {
    document.head.querySelector('meta[name="robots"]')?.remove();
    upsert('link[rel="canonical"]', () => {
      const el = document.createElement('link');

      el.rel = 'canonical';

      return el;
    }).setAttribute('href', url);
  }
};
