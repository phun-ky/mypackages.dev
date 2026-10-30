import type { Session } from '@supabase/supabase-js';

import { Link } from '../../actions/Link';
import { ThemeToggle } from '../../actions/ThemeToggle';
import { Logo } from '../../media/Logo';
import './styles/siteHeader.css';

const html = String.raw;

export type SiteHeaderPropsType = {
  session?: Session | null;
  /** The main section the page belongs to, marked in the nav */
  current?: 'packages' | 'users' | 'about';
  /** On the front page, "How it works" scrolls; elsewhere it goes there */
  onStartPage?: boolean;
  /** The account menu for a signed-in user, rendered by ProfileMenu */
  account?: string;
};

/**
 * The header for the Nebula, refined design (#47): the logo, the main
 * sections, the theme toggle, and sign in, or the dashboard and the account
 * menu.
 */
export const SiteHeader = ({
  session,
  current,
  onStartPage = false,
  account = ''
}: SiteHeaderPropsType) => {
  let actions = Link({
    to: '/dashboard/signin',
    className: 'pill-button',
    children: 'Sign in'
  });

  if (session) {
    actions =
      Link({
        to: '/dashboard',
        className: 'pill-button site-header-dashboard',
        children: 'Dashboard'
      }) + account;
  }

  return html`<header class="site-header">
    ${Link({
      to: '/',
      className: 'site-header-brand',
      children: html`${Logo()}<span>My packages</span>`
    })}
    <nav class="site-header-nav" aria-label="Main">
      ${Link({
        to: '/packages',
        children: 'Packages',
        ...(current === 'packages' && { 'aria-current': 'page' })
      })}
      ${Link({
        to: '/users',
        children: 'Users',
        ...(current === 'users' && { 'aria-current': 'page' })
      })}
      ${Link({ to: onStartPage ? '#how' : '/#how', children: 'How it works' })}
      ${Link({
        to: '/help/about',
        children: 'About',
        ...(current === 'about' && { 'aria-current': 'page' })
      })}
    </nav>
    <div class="site-header-actions">${ThemeToggle()} ${actions}</div>
  </header>`;
};
