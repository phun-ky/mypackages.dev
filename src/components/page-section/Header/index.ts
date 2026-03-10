import { addOnClick } from '../../../lib/spa';
import type { PagePropsType } from '../../../lib/spa/types';
import { signInWithGitHub } from '../../../services/github';
import { cx } from '../../../utils/cx';
import { Link } from '../../actions/Link';
import { Breadcrumbs } from '../Breadcrumbs';
import type { BreadcrumbItem } from '../Breadcrumbs/utils/get-breadcrumbs';

import { ProfileMenu } from './components/ProfileMenu';
import './styles/header.css';

const html = String.raw;

export type HeaderPropsType = Partial<PagePropsType> & {
  page: string;
  crumbs: BreadcrumbItem[];
};

export const Header = async (props: HeaderPropsType) => {
  const { page, session, crumbs } = props;

  addOnClick('start-dashboard', () => {
    signInWithGitHub();
  });

  const isAuthed = Boolean(session);
  const signInButtonClassnames = cx('login-button button', {
    'is-hidden': isAuthed
  });
  const dashBoardButtonClassnames = cx('button primary', {
    'is-hidden': !isAuthed
  });

  if (page === 'StartPage' || page === 'SignInPage') return html``;

  if (
    page === 'AboutPage' ||
    page === 'HelpPage' ||
    page === 'FAQPage' ||
    page === 'FeedbackPage'
  ) {
    return html`<header class="header external">
      ${Link({
        to: '/',
        children: html`<svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 -960 960 960"
        >
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
        </svg>`,
        className: 'logo'
      })}

      <div class="signin-container">
        ${Link({
          to: '/dashboard/signin',
          children: 'Sign in',
          className: signInButtonClassnames
        })}
        ${Link({
          to: '/dashboard',
          children: 'Dashboard',
          className: dashBoardButtonClassnames
        })}
      </div>
    </header>`;
  }

  return html`<header class="header">
    ${crumbs.length ? Breadcrumbs({ items: crumbs }) : ''}
    <div class="signin-container">
      ${Link({
        to: '/dashboard/signin',
        children: 'Sign in',
        className: signInButtonClassnames
      })}
      ${Link({
        to: '/dashboard',
        children: 'Dashboard',
        className: dashBoardButtonClassnames
      })}
    </div>
    ${await ProfileMenu(session)}
  </header>`;
};
