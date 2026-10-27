import { SiteHeader } from '../../components/page-section/SiteHeader';
import {
  attachUserPageEvents,
  getStoredView
} from '../../features/user/interactions';
import { buildPortfolio } from '../../features/user/portfolio/build-portfolio';
import { getMonthlyDownloads } from '../../features/user/portfolio/get-monthly-downloads';
import { packagesSection, pageHead } from '../../features/user/sections';
import type { PagePropsType } from '../../lib/spa/types';
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
  const header = SiteHeader({ session, current: 'users' });

  if (!username) {
    return html`<div class="user-page nebula-page">
      ${header}
      <div class="user-content"><h1>No user given</h1></div>
    </div>`;
  }

  attachUserPageEvents(options);

  const items = await getUserPackages(username, signal, options);
  const monthly = await getMonthlyDownloads(
    items.map((item) => item.package.name),
    signal
  );
  const now = Date.now();
  const portfolio = buildPortfolio(items, monthly, now);
  const head = pageHead({
    username,
    portfolio,
    maintainer: options.maintainer,
    session,
    packagesOnly: true
  });

  if (!portfolio.packages.length) {
    const role = options.maintainer ? 'maintains' : 'authored';

    return html`<div class="user-page nebula-page">
      ${header}
      <div class="user-content">
        ${head}
        <p class="user-empty">
          No packages found that ${escapeHtml(username)} ${role}. Try switching
          between maintainer and author above.
        </p>
      </div>
    </div>`;
  }

  return html`<div class="user-page nebula-page">
    ${header}
    <div class="user-content">
      ${head} ${packagesSection(portfolio, now, getStoredView())}
    </div>
  </div>`;
};
