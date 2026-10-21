import type { Session } from '@supabase/supabase-js';

import { Link } from '../../actions/Link';
import { ThemeToggle } from '../../actions/ThemeToggle';
import { Logo } from '../../media/Logo';
import './styles/siteHeader.css';

const html = String.raw;

export type SiteHeaderPropsType = {
  session?: Session | null;
  /** The main section the page belongs to, marked in the nav */
  current?: 'packages' | 'users';
  /** On the front page, "How it works" scrolls; elsewhere it goes there */
  onStartPage?: boolean;
};

/**
 * The header for the Nebula, refined design (#47): the logo, the main
 * sections, the theme toggle, and sign in or the dashboard.
 */
export const SiteHeader = ({
  session,
  current,
  onStartPage = false
}: SiteHeaderPropsType) =>
  html`<header class="site-header">
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
      ${Link({ to: '/help/about', children: 'About' })}
    </nav>
    <div class="site-header-actions">
      ${ThemeToggle()}
      ${
        session
          ? Link({
              to: '/dashboard',
              className: 'pill-button',
              children: 'Dashboard'
            })
          : Link({
              to: '/dashboard/signin',
              className: 'pill-button',
              children: 'Sign in'
            })
      }
    </div>
  </header>`;
