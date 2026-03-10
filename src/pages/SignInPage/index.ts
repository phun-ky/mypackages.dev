import { Button } from '../../components/actions/Button';
import { Link } from '../../components/actions/Link';
import { Container } from '../../components/layout/Container';
import { PackagePreview } from '../../features/start/package-preview';
import { addOnAfterAppRender, addOnClick } from '../../lib/spa';
import type { PagePropsType } from '../../lib/spa/types';
import { navigateTo } from '../../lib/spa/utils/navigate-to';
import { signInWithGitHub } from '../../services/github';

import './styles/signInPage.css';

const html = String.raw;

export type SignInPagePropsType = PagePropsType;

export const SignInPage = async (props: SignInPagePropsType) => {
  const { session } = props;

  addOnClick('signin', () => {
    signInWithGitHub();
  });

  addOnAfterAppRender(async () => {
    console.log('session from signinpage', session);

    if (session) {
      const urlParams = new URLSearchParams(window.location.search);
      const returnTo = urlParams.get('returnTo') || '/dashboard';

      // after successful auth:
      await navigateTo(returnTo);
    }
  });

  return html`<section class="sign-in-page">
    <main>
      <header>
        ${Container({
          children: html`${Link({
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
              </svg>
              My packages`,
            className: 'home-link'
          })}`
        })}
      </header>
      ${Container({
        children: html`<h1>Welcome back</h1>
          <p>Sign in to your account</p>
          ${Button({
            id: 'signin',
            children: html`<svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 98 96"
              >
                <path
                  fill="currentColor"
                  fill-rule="evenodd"
                  d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                  clip-rule="evenodd"
                />
              </svg>
              Continue with GitHub`,
            className: 'login-button button primary cta'
          })}
          <p>
            Don't have an account?
            ${Link({ to: '/dashboard/signup', children: 'Sign up' })}
          </p>`
      })}
    </main>
    <aside>${PackagePreview()}</aside>
  </section>`;
};
