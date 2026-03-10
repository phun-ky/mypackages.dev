import { Link } from '../../components/actions/Link';
import { RadioGroup } from '../../components/input-fields/RadioGroup';
import { Container } from '../../components/layout/Container';
import { Logo } from '../../components/media/Logo';
import { attachEvents } from '../../features/start/events/attach-events';
import { FrontpageSearchStatistics } from '../../features/start/frontpage-search-statistics';
import { PackagePreview } from '../../features/start/package-preview';
import type { PagePropsType } from '../../lib/spa/types';
import { supabase } from '../../services/supabase';
import { cx } from '../../utils/cx';

import './styles/startPage.css';

const html = String.raw;

export type StartPagePropsType = PagePropsType;

export const StartPage = async (
  props: StartPagePropsType,
  signal: AbortSignal
) => {
  console.log(props, signal);

  const { session } = props;

  attachEvents(supabase, signal);

  const isAuthed = Boolean(session);
  const signInButtonClassnames = cx('login-button button', {
    'is-hidden': isAuthed
  });
  const dashBoardButtonClassnames = cx('button primary', {
    'is-hidden': !isAuthed
  });

  return html`<section class="start-page">
    ${Container({
      children: html`<div class="start-page-inner">
        <header class="frontpage-header">
          ${Link({
            to: '/',
            children: Logo(),
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
        </header>
        <div class="start-page-content">
          <div class="hero">
            <h1>Show me <br /><span class="user-animation"></span></h1>
            <p class="tagline">
              Track downloads, health, security & provenance across time
            </p>

            <form class="start-page-form" onsubmit="javascript: return false;">
              <div class="input-group horizontal ">
                ${RadioGroup({
                  name: 'kind',
                  defaultChecked: 'auto',
                  options: [
                    {
                      id: 'auto',
                      value: 'auto',
                      label: 'Auto'
                    },
                    {
                      id: 'package',
                      value: 'package',
                      label: 'Package'
                    },
                    {
                      id: 'user',
                      value: 'user',
                      label: 'User'
                    }
                  ]
                })}
              </div>
              <div class="input-group horizontal">
                <input
                  type="search"
                  placeholder="Try: @phun-ky/speccer"
                  id="query-term-to-use"
                  autocomplete="off"
                  data-lpignore="true"
                />
                <button type="button" id="show-me" class="button primary cta">
                  Show me
                </button>
              </div>
              <div class="input-group horizontal">
                <a data-link href="/users/phun-ky" class="button">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="var(--color-brand)"
                    viewBox="0 -960 960 960"
                  >
                    <path
                      d="M480-492.31q-57.75 0-98.87-41.12Q340-574.56 340-632.31t41.13-98.87q41.12-41.13 98.87-41.13t98.87 41.13Q620-690.06 620-632.31t-41.13 98.88q-41.12 41.12-98.87 41.12M180-187.69v-88.93q0-29.38 15.96-54.42t42.66-38.5q59.3-29.07 119.65-43.61T480-427.69t121.73 14.54 119.65 43.61q26.7 13.46 42.66 38.5T780-276.62v88.93z"
                    />
                  </svg>
                  phun-ky
                </a>
                <a
                  data-link
                  href="/packages/@hybrid-compute/remote"
                  class="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="#10b981"
                    viewBox="0 -960 960 960"
                  >
                    <path
                      d="M450-177.23v-285.54L200-607.54v278.62q0 3.07 1.54 5.77 1.54 2.69 4.61 4.61zm60 0 243.85-141.31q3.07-1.92 4.61-4.61 1.54-2.7 1.54-5.77v-278.62L510-462.77zm-66.15 65.46L176.16-265.85q-17.08-9.84-26.62-26.3-9.54-16.47-9.54-36.16v-303.38q0-19.69 9.54-36.16 9.54-16.46 26.62-26.3l267.69-154.08q17.07-9.85 36.15-9.85t36.15 9.85l267.69 154.08q17.08 9.84 26.62 26.3 9.54 16.47 9.54 36.16v303.38q0 19.69-9.54 36.16-9.54 16.46-26.62 26.3L516.15-111.77q-17.07 9.85-36.15 9.85t-36.15-9.85M634.23-604 727-657.23 486.15-796.54q-3.07-1.92-6.15-1.92t-6.15 1.92l-86.85 50zM480-514.46l93-53.85-247-142.77-93 53.85z"
                    />
                  </svg>
                  @hybrid-compute/remote
                </a>
              </div>
            </form>
          </div>
          ${PackagePreview()} ${await FrontpageSearchStatistics()}
        </div>
      </div>`
    })}
  </section>`;
};
