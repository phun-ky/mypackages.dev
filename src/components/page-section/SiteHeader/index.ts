import type { Session } from '@supabase/supabase-js';

import { Link } from '../../actions/Link';
import { ThemeToggle } from '../../actions/ThemeToggle';
import { Logo } from '../../media/Logo';
import './styles/siteHeader.css';

const html = String.raw;

export type SiteHeaderPropsType = {
  session?: Session | null;
};

/**
 * The header for the Nebula, refined design (#47): the logo, the main
 * sections, the theme toggle, and sign in or the dashboard.
 */
export const SiteHeader = ({ session }: SiteHeaderPropsType) =>
  html`<header class="site-header">
    ${Link({
      to: '/',
      className: 'site-header-brand',
      children: html`${Logo()}<span>My packages</span>`
    })}
    <nav class="site-header-nav" aria-label="Main">
      ${Link({ to: '/packages', children: 'Packages' })}
      ${Link({ to: '/users', children: 'Users' })}
      ${Link({ to: '/help/faq', children: 'FAQ' })}
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
