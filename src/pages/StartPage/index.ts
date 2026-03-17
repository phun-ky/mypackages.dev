import { Link } from '../../components/actions/Link';
import { Container } from '../../components/layout/Container';
import { Logo } from '../../components/media/Logo';
import { attachEvents } from '../../features/start/events/attach-events';
import { FrontpageSearchStatistics } from '../../features/start/frontpage-search-statistics';
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
            </form>
          </div>

          ${await FrontpageSearchStatistics()}
        </div>
      </div>`
    })}
  </section>`;
};
