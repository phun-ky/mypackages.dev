import { getActiveProviderTokenMeta } from '../../features/profile/secrets/utils/get-active-provider-token-meta';
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
  topics
} from '../../features/user/sections';
import type { PagePropsType } from '../../lib/spa/types';
import { countUserPackages } from '../../services/npm/packages/count-user-packages';
import { getUserPackages } from '../../services/npm/packages/get-user-packages';
import { supabase } from '../../services/supabase';
import { getUserSettings } from '../../services/supabase/utils/user-settings';
import { escapeAttr, escapeHtml } from '../../utils/escape-html';

import '../UserPage/styles/userPage.css';
import './styles/dashboardPage.css';

export type DashboardPagePropsType = PagePropsType;

const page = (content: string) =>
  `<div class="user-page dashboard-page nebula-page"><div class="user-content">${content}</div></div>`;

/**
 * The signed-in user's own packages (#78): their user page, with what only
 * they see: whether npm limits the site for them, and where to change it.
 */
export const DashboardPage = async (
  props: DashboardPagePropsType,
  signal: AbortSignal
) => {
  const { options, session } = props;

  if (!session) return '';

  const { npmUsername } = await getUserSettings(session);

  if (!npmUsername) {
    return page(`<div class="user-head"><div class="user-title"><h1>Dashboard</h1></div></div>
<section class="user-card dashboard-start" aria-labelledby="dashboard-start-title">
  <h2 id="dashboard-start-title">Add your npm username</h2>
  <p>The dashboard shows the packages you maintain on npm. Add your npm username on your profile, and they show up here.</p>
  <a class="pill-button is-primary" href="/profile" data-link>Go to your profile</a>
</section>`);
  }

  attachUserPageEvents();

  const token = await getActiveProviderTokenMeta(
    supabase,
    { provider: 'npm' },
    signal
  ).catch(() => null);
  const items = await getUserPackages(npmUsername, signal, options);
  const summaries = await getDownloadSummaries(
    items.map((item) => item.package.name),
    signal
  );
  const found = await countUserPackages(npmUsername, signal, options);
  const now = Date.now();
  const portfolio = buildPortfolio(items, summaries, now, { found });
  const name = escapeHtml(npmUsername);
  const head = `<div class="user-head">
  <div class="user-title">
    <h1>Dashboard</h1>
    <p class="user-sub">Your packages, as <strong>${name}</strong> on npm · <a href="/users/${escapeAttr(npmUsername)}" data-link>Your public page</a> · <a href="/profile" data-link>Profile</a></p>
  </div>
  <div class="user-controls">
    <button type="button" id="refresh-data" class="pill-button"><span aria-hidden="true">↻</span> Refresh data</button>
  </div>
</div>
${
  token
    ? ''
    : '<p class="user-notice" role="note"><strong>No npm token yet.</strong> npm limits how much the site can fetch, so some numbers may be missing. <a href="/profile/secrets/new" data-link>Add an npm token</a></p>'
}`;

  if (!portfolio.packages.length) {
    return page(
      `${head}<p class="user-empty">${name} doesn't maintain any packages on npm yet. Check your npm username on your <a href="/profile" data-link>profile</a>.</p>`
    );
  }

  return page(
    `${head} ${overview(portfolio)} ${atAGlance(portfolio, now)} ${packagesSection(portfolio, now, getStoredView())} ${topics(portfolio)}`
  );
};
