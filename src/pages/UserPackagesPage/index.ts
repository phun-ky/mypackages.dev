import {
  attachUserPageEvents,
  getStoredView
} from '../../features/user/interactions';
import { buildPortfolio } from '../../features/user/portfolio/build-portfolio';
import { getDownloadSummaries } from '../../features/user/portfolio/get-download-summaries';
import { packagesSection, pageHead } from '../../features/user/sections';
import type { PagePropsType } from '../../lib/spa/types';
import { countUserPackages } from '../../services/npm/packages/count-user-packages';
import { getUserPackages } from '../../services/npm/packages/get-user-packages';
import { escapeHtml } from '../../utils/escape-html';

import '../UserPage/styles/userPage.css';

const html = String.raw;

export type UserPackagesPagePropsType = PagePropsType;

/**
 * Only the packages of a user (#62): the user page's Packages section, by
 * scope or in a table, at full width.
 */
export const UserPackagesPage = async (
  props: UserPackagesPagePropsType,
  signal: AbortSignal
) => {
  const { username, options, session = null } = props;

  if (!username) {
    return html`<div class="user-page nebula-page">
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
    session,
    packagesOnly: true
  });

  if (!portfolio.packages.length) {
    return html`<div class="user-page nebula-page">
      <div class="user-content">
        ${head}
        <p class="user-empty">
          ${escapeHtml(username)} doesn't maintain any packages on npm.
        </p>
      </div>
    </div>`;
  }

  return html`<div class="user-page nebula-page">
    <div class="user-content">
      ${head} ${packagesSection(portfolio, now, getStoredView())}
    </div>
  </div>`;
};
