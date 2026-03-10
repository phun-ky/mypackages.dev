import type { Routes } from '../types';

export const routes = [
  { path: '/', page: 'StartPage', name: 'Start', regex: /^\/$/, public: true },

  // Private dashboard for logged-in user
  {
    path: '/dashboard/signin',
    page: 'SignInPage',
    name: 'Sign In',
    regex: /^\/dashboard\/signin$/,
    public: true
  },
  {
    path: '/dashboard/signup',
    page: 'SignUpPage',
    name: 'Sign Up',
    regex: /^\/dashboard\/signup$/,
    public: true
  },
  {
    path: '/dashboard',
    page: 'DashboardPage',
    name: 'Dashboard',
    regex: /^\/dashboard$/,
    public: false
  },

  // Public list of packages for a user (must come before /users/:username)
  {
    path: '/users/:username/packages',
    page: 'UserPackagesPage',
    name: 'User Packages',
    regex: /^\/users\/([^/]+)\/packages$/,
    public: true
  },
  // Public user profile
  {
    path: '/users/:username',
    page: 'UserPage',
    name: 'User profile',
    regex: /^\/users\/([^/]+)$/,
    public: true
  },
  {
    path: '/users',
    page: 'UsersPage',
    name: 'Users',
    regex: /^\/users$/,
    public: true
  },

  // Public explorer/search index (optional but recommended)
  {
    path: '/packages',
    page: 'PackagesPage',
    name: 'Packages',
    regex: /^\/packages$/,
    public: true
  },

  // Canonical package page (supports scoped packages like @scope/name)
  {
    path: '/packages/:packageName',
    page: 'PackagePage',
    name: 'Package',
    regex: /^\/packages\/(.+)$/,
    public: true
  },

  {
    path: '/profile/secrets/new',
    page: 'NewSecretPage',
    name: 'New Secret',
    regex: /^\/profile\/secrets\/new$/,
    public: false
  },
  {
    path: '/profile/secrets',
    page: 'SecretsPage',
    name: 'Secrets',
    regex: /^\/profile\/secrets$/,
    public: false
  },
  {
    path: '/profile',
    page: 'ProfilePage',
    name: 'Profile',
    regex: /^\/profile$/,
    public: false
  },

  {
    path: '/help',
    page: 'HelpPage',
    name: 'Help',
    regex: /^\/help$/,
    public: true
  },
  {
    path: '/help/about',
    page: 'AboutPage',
    name: 'About',
    regex: /^\/help\/about$/,
    public: true
  },
  {
    path: '/help/feedback',
    page: 'FeedbackPage',
    name: 'Feedback',
    regex: /^\/help\/feedback$/,
    public: true
  },
  {
    path: '/help/faq',
    page: 'FAQPage',
    name: 'FAQ',
    regex: /^\/help\/faq$/,
    public: true
  }
] as const satisfies Routes;

export type PageId = (typeof routes)[number]['page'];
