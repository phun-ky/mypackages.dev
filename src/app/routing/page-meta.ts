import { routes } from '../../lib/spa/router/routes';
import { escapeAttr, escapeHtml } from '../../utils/escape-html';

// Each page's title, description and canonical URL (#40), in one place for
// the build, which writes them into the prerendered pages, and the router,
// which sets them on every navigation. Pure, so vite.config.ts can use it.

export const SITE_NAME = 'My packages';

export const ORIGIN = 'https://mypackages.dev';

// A placeholder until the Open Graph images of #108: square, so the card
// is `summary`, not `summary_large_image`
export const SOCIAL_IMAGE = '/meta/web-app-manifest-512x512.png';

export type PageMeta = {
  title: string;
  description: string;
  /** Canonical path, like `/packages/speccer`; null for no address */
  path: string | null;
  /** Kept out of search engines and the sitemap */
  noindex: boolean;
};

type Entry = {
  title: string | ((params: Record<string, string>) => string);
  description: string | ((params: Record<string, string>) => string);
  noindex?: boolean;
};

const PAGES: Record<string, Entry> = {
  '/': {
    title: 'My packages: npm downloads and package health',
    description:
      'Downloads, releases and health for every npm package a user maintains, month by month, from npm’s own data.'
  },
  '/packages': {
    title: 'Packages',
    description:
      'The npm packages people look up most on My packages, with their downloads, and the latest lookups.'
  },
  '/packages/:packageName': {
    title: ({ packageName }) => packageName,
    description: ({ packageName }) =>
      `Downloads, releases and health of the npm package ${packageName}, month by month.`
  },
  '/users': {
    title: 'Users',
    description:
      'The npm users people look up most on My packages, and the packages they maintain.'
  },
  '/users/:username': {
    title: ({ username }) => username,
    description: ({ username }) =>
      `The npm packages ${username} maintains: downloads, what needs attention and what is doing well.`
  },
  '/users/:username/packages': {
    title: ({ username }) => `Packages by ${username}`,
    description: ({ username }) =>
      `Every npm package ${username} maintains, by scope or in a table, with downloads and releases.`
  },
  '/help': {
    title: 'Help',
    description:
      'Help with My packages: questions and answers, what the site is, and how to give feedback.'
  },
  '/help/about': {
    title: 'About',
    description:
      'What My packages is, who makes it, and where its numbers come from.'
  },
  '/help/faq': {
    title: 'Questions and answers',
    description:
      'How My packages counts downloads, which packages it shows, and what its scores mean.'
  },
  '/help/feedback': {
    title: 'Feedback',
    description: 'Report a bug or suggest a change to My packages on GitHub.'
  },
  '/dashboard/signin': {
    title: 'Sign in',
    description: 'Sign in to My packages with GitHub.',
    noindex: true
  },
  '/dashboard/signup': {
    title: 'Sign up',
    description: 'Create a My packages account with GitHub.',
    noindex: true
  }
};
const NOT_FOUND: PageMeta = {
  title: `Page not found · ${SITE_NAME}`,
  description: 'There is no page at this address on My packages.',
  path: '/404',
  noindex: true
};

/**
 * For 404.html, which GitHub Pages serves for every package and user page
 * (#39): what a link preview shows, since crawlers don't run the app. The
 * site's name, not "Page not found", and no address, so a preview doesn't
 * point every package at one URL. The app sets the page's own on render.
 */
export const APP_SHELL: PageMeta = {
  title: SITE_NAME,
  description:
    'Downloads, releases and health of npm packages and the people who maintain them, month by month, from npm’s own data.',
  path: null,
  noindex: true
};

/** The title, description and canonical path for a path on the site. */
export const pageMeta = (pathname: string): PageMeta => {
  for (const route of routes) {
    const match = route.regex ? pathname.match(route.regex) : null;

    if (!match) continue;

    const routePath = route.path ?? '';
    const keys = [...routePath.matchAll(/:(\w+)/g)].map((m) => m[1]);
    const params = Object.fromEntries(
      keys.map((key, i) => [key, match[i + 1]])
    );
    const entry = PAGES[routePath];

    // Signed-in pages have nothing to show a search engine or a link preview
    if (!entry) {
      return {
        title: `${route.name} · ${SITE_NAME}`,
        description: `${route.name} on My packages.`,
        path: pathname,
        noindex: true
      };
    }

    const title =
      typeof entry.title === 'function' ? entry.title(params) : entry.title;

    return {
      title: routePath === '/' ? title : `${title} · ${SITE_NAME}`,
      description:
        typeof entry.description === 'function'
          ? entry.description(params)
          : entry.description,
      path: pathname,
      // Package and user pages are served from 404.html with status 404
      // (#39), so they stay out of search engines, without a canonical URL
      noindex: entry.noindex ?? (!route.public || keys.length > 0)
    };
  }

  return NOT_FOUND;
};

/** The paths for sitemap.xml: every public page without parameters. */
export const sitemapPaths = () =>
  routes
    .map((route) => route.path ?? '')
    .filter((path) => path && !path.includes(':') && !pageMeta(path).noindex);

/** The head tags for a page, for the prerendered HTML. */
export const metaTags = (meta: PageMeta) => {
  const url = meta.path === null ? null : `${ORIGIN}${meta.path}`;
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeAttr(meta.description)}" />`,
    meta.noindex || !url
      ? '<meta name="robots" content="noindex" />'
      : `<link rel="canonical" href="${escapeAttr(url)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:locale" content="en_GB" />',
    `<meta property="og:title" content="${escapeAttr(meta.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(meta.description)}" />`,
    ...(url ? [`<meta property="og:url" content="${escapeAttr(url)}" />`] : []),
    `<meta property="og:image" content="${ORIGIN}${SOCIAL_IMAGE}" />`,
    '<meta property="og:image:width" content="512" />',
    '<meta property="og:image:height" content="512" />',
    `<meta property="og:image:alt" content="The ${SITE_NAME} logo" />`,
    '<meta name="twitter:card" content="summary" />',
    `<meta name="twitter:title" content="${escapeAttr(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(meta.description)}" />`
  ];

  return tags.join('\n    ');
};
