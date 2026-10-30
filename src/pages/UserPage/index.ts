import { SiteHeader } from '../../components/page-section/SiteHeader';
import {
  attachUserPageEvents,
  getStoredView
} from '../../features/user/interactions';
import { buildPortfolio } from '../../features/user/portfolio/build-portfolio';
import { getDownloadSummaries } from '../../features/user/portfolio/get-download-summaries';
import {
  atAGlance,
  overview,
  packagesSection,
  pageHead,
  topics
} from '../../features/user/sections';
import type { PagePropsType } from '../../lib/spa/types';
import { countUserPackages } from '../../services/npm/packages/count-user-packages';
import { getUserPackages } from '../../services/npm/packages/get-user-packages';
import { escapeHtml } from '../../utils/escape-html';

import './styles/userPage.css';

const html = String.raw;

export type UserPagePropsType = PagePropsType;

/**
 * A complete overview of a user's packages, in the Insights design (#62):
 * the totals and where they come from, what needs attention, and every
 * package by scope or in a table.
 */
export const UserPage = async (
  props: UserPagePropsType,
  signal: AbortSignal
) => {
  const { username, options, session = null } = props;
  const header = SiteHeader({ session, current: 'users' });

  if (!username) {
    return html`<div class="user-page nebula-page">
      ${header}
      <div class="user-content"><h1>No user given</h1></div>
    </div>`;
  }

  attachUserPageEvents();

  const items = await getUserPackages(username, signal, options);
  const summaries = await getDownloadSummaries(
    items.map((item) => item.package.name),
    signal
  );
  const found = await countUserPackages(username, signal, options);
  const now = Date.now();
  const portfolio = buildPortfolio(items, summaries, now, { found });
  const head = pageHead({
    username,
    portfolio,
    session
  });

  if (!portfolio.packages.length) {
    return html`<div class="user-page nebula-page">
      ${header}
      <div class="user-content">
        ${head}
        <p class="user-empty">
          ${escapeHtml(username)} doesn't maintain any packages on npm.
        </p>
      </div>
    </div>`;
  }

  return html`<div class="user-page nebula-page">
    ${header}
    <div class="user-content">
      ${head} ${overview(portfolio)} ${atAGlance(portfolio, now)}
      ${packagesSection(portfolio, now, getStoredView())} ${topics(portfolio)}
    </div>
  </div>`;
};
