/* eslint-disable @typescript-eslint/no-explicit-any */
export type BreadcrumbMenuEntry =
  | string
  | ((params: Record<string, any>) => string)
  | { href: string | ((params: Record<string, any>) => string); label: string };

export type BreadcrumbMeta = {
  /** parent route.path */
  parent?: string;

  /** label override (dynamic supported) */
  label?: string | ((params: Record<string, any>) => string);

  /** optional menu entries */
  menu?: BreadcrumbMenuEntry[];
  className?: string;
  icon?: string;
};

const html = String.raw;

export const breadcrumbMetaByPath: Record<string, BreadcrumbMeta> = {
  '/': {
    label: 'Start',
    menu: [
      '/packages',
      '/users',
      '/about',
      // dashboard will be filtered by auth, but you can keep it here:
      '/dashboard'
    ],
    className: 'home-link',
    icon: html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
      <defs>
        <linearGradient id="a" x1="1" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#38bdf8" />
          <stop offset="1" stop-color="#1dcf9e" />
        </linearGradient>
      </defs>
      <path
        fill="url(#a)"
        d="M450-177.23v-285.54L200-607.54v278.62q0 3.07 1.54 5.77 1.54 2.69 4.61 4.61zm60 0 243.85-141.31q3.07-1.92 4.61-4.61 1.54-2.7 1.54-5.77v-278.62L510-462.77zm-66.15 65.46L176.16-265.85q-17.08-9.84-26.62-26.3-9.54-16.47-9.54-36.16v-303.38q0-19.69 9.54-36.16 9.54-16.46 26.62-26.3l267.69-154.08q17.07-9.85 36.15-9.85t36.15 9.85l267.69 154.08q17.08 9.84 26.62 26.3 9.54 16.47 9.54 36.16v303.38q0 19.69-9.54 36.16-9.54 16.46-26.62 26.3L516.15-111.77q-17.07 9.85-36.15 9.85t-36.15-9.85M634.23-604 727-657.23 486.15-796.54q-3.07-1.92-6.15-1.92t-6.15 1.92l-86.85 50zM480-514.46l93-53.85-247-142.77-93 53.85z"
      />
    </svg>`
  },

  '/dashboard': {
    parent: '/',
    label: 'Dashboard'
  },
  '/profile': {
    parent: '/',
    label: 'Profile',
    menu: [{ href: '/profile/secrets', label: 'Secrets' }]
  },
  '/profile/secrets': {
    parent: '/profile',
    label: 'Secrets'
  },
  '/profile/secrets/new': {
    parent: '/profile/secrets',
    label: 'New secret'
  },

  '/packages': {
    parent: '/',
    label: 'Packages',
    menu: [
      { href: '/packages', label: 'Browse packages' },
      { href: '/', label: 'Search' }
    ]
  },

  '/packages/:packageName': {
    parent: '/packages',
    label: (p) => String(p.packageName ?? 'Package')
  },

  '/users': {
    parent: '/',
    label: 'Users',
    menu: [{ href: '/', label: 'Search' }]
  },

  '/users/:username': {
    parent: '/users',
    label: (p) => `${String(p.username ?? 'user')}`,
    menu: [
      {
        href: (p) => `/users/${p.username}/packages`,
        label: 'Packages'
      }
    ]
  },

  '/users/:username/packages': {
    parent: '/users/:username',
    label: 'Packages'
  },

  '/help': {
    parent: '/',
    label: 'Help',
    menu: [
      { href: '/help/about', label: 'About' },
      { href: '/help/faq', label: 'FAQ' },
      { href: '/help/feedback', label: 'Feedback' }
    ]
  },
  '/help/about': {
    parent: '/help',
    label: 'About'
  },
  '/help/faq': {
    parent: '/help',
    label: 'FAQ'
  },
  '/help/feedback': {
    parent: '/help',
    label: 'Feedback'
  }
};
