import type { Session } from '@supabase/supabase-js';

import { areaChart, sparkline } from '../../components/media/Charts';
import { getInitialsForUser } from '../../components/page-section/Header/utils/get-initials-for-user';
import { escapeAttr, escapeHtml } from '../../utils/escape-html';

import type { Portfolio, PortfolioPackage } from './portfolio/build-portfolio';

// The user page in the Insights design (#62). Plain template strings, not
// `html`, so Prettier never splits an end tag over two lines, which diff-dom
// can't read (#64). Everything from npm is escaped.

const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});
const full = new Intl.NumberFormat('en-US');
const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const DAY_MS = 24 * 60 * 60 * 1000;
const countPackages = (n: number) => `${n} ${n === 1 ? 'package' : 'packages'}`;

export const formatChange = (pct: number | null) =>
  pct === null || !Number.isFinite(pct)
    ? 'new'
    : `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}%`;

const changeClass = (pct: number | null) =>
  pct === null ? 'is-flat' : pct >= 0 ? 'is-up' : 'is-down';

export const ago = (ms: number | null, now: number) => {
  if (ms === null) return 'never';

  const days = Math.round((now - ms) / DAY_MS);

  if (days < 31) return relative.format(-days, 'day');

  if (days < 365) return relative.format(-Math.round(days / 30), 'month');

  return relative.format(-Math.round(days / 365), 'year');
};

const link = (name: string, className = '') =>
  `<a href="/packages/${escapeAttr(name)}" data-link class="${className}">${escapeHtml(name)}</a>`;
const flags = (pkg: PortfolioPackage) =>
  `${pkg.types ? '<span class="pkg-badge is-types" title="Ships TypeScript types">TS</span>' : ''}${pkg.deprecated ? '<span class="pkg-badge is-deprecated">Deprecated</span>' : ''}${pkg.dormant ? '<span class="pkg-badge is-dormant" title="No release in the last year">Dormant</span>' : ''}`;

export const pageHead = ({
  username,
  portfolio,
  maintainer,
  session,
  packagesOnly = false
}: {
  username: string;
  portfolio: Portfolio;
  maintainer: boolean;
  session: Session | null;
  // For /users/:username/packages, which links back to the overview
  packagesOnly?: boolean;
}) => {
  const role = maintainer ? 'maintained' : 'authored';
  const name = escapeHtml(username);
  const title = packagesOnly ? `Packages by ${name}` : name;
  const overviewLink = packagesOnly
    ? ` · <a href="/users/${escapeAttr(username)}" data-link>Overview</a>`
    : '';
  const notice = session
    ? 'npm limits how much the site can fetch without your npm token, so some numbers may be missing. <a href="/profile/secrets/new" data-link>Add an npm token</a>'
    : 'npm limits how much the site can fetch for signed-out visitors, so some numbers may be missing. <a href="/dashboard/signin" data-link>Sign in</a> and add an npm token for complete data.';

  return `<div class="user-head">
  <span class="user-avatar" aria-hidden="true">${escapeHtml(getInitialsForUser(username))}</span>
  <div class="user-title">
    <h1>${title}</h1>
    <p class="user-sub">${countPackages(portfolio.packages.length)} ${role} on npm${overviewLink} · <a href="https://www.npmjs.com/~${escapeAttr(username)}" target="_blank" rel="noopener noreferrer">npm profile</a></p>
  </div>
  <div class="user-controls">
    <div class="segmented" role="group" aria-label="Packages to show">
      <button type="button" id="role-maintainer" aria-pressed="${maintainer}">Maintainer</button><button type="button" id="role-author" aria-pressed="${!maintainer}">Author</button>
    </div>
    <button type="button" id="refresh-data" class="pill-button"><span aria-hidden="true">↻</span> Refresh data</button>
  </div>
</div>
<p class="user-notice" role="note"><strong>This site is in alpha.</strong> ${notice}</p>`;
};

const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleString('en-GB', {
    month: 'short',
    timeZone: 'UTC'
  });

export const overview = (portfolio: Portfolio) => {
  const { monthly, change, months, share, packages } = portfolio;
  const shareRows = share
    .map(
      (s, i) =>
        `<li><span class="share-dot share-${i}"></span><span class="share-name">${escapeHtml(s.name)}</span><span class="num">${compact.format(s.monthly)}</span><span class="num muted">${monthly ? ((s.monthly / monthly) * 100).toFixed(1) : '0.0'}%</span></li>`
    )
    .join('');
  const shareBar = share
    .map(
      (s, i) =>
        `<span class="share-${i}" style="width:${monthly ? (s.monthly / monthly) * 100 : 0}%"></span>`
    )
    .join('');

  return `<section class="user-overview" aria-label="Overview">
  <div class="user-card user-total">
    <span class="user-label">Monthly downloads, all ${countPackages(packages.length)}</span>
    <span class="user-big">${compact.format(monthly)}</span>
    <span class="user-change ${changeClass(change)}">${formatChange(change)} month over month</span>
    ${areaChart(
      months.map((m) => m.downloads),
      months.map((m) => monthLabel(m.month)),
      {
        label: `Monthly downloads for all packages, the last ${months.length} complete months`
      }
    )}
  </div>
  <div class="user-card user-share">
    <h2>Where the downloads come from</h2>
    <div class="share-bar" aria-hidden="true">${shareBar}</div>
    <ol>${shareRows}</ol>
  </div>
</section>`;
};

const glanceList = (rows: string[], empty: string) =>
  rows.length
    ? `<ul>${rows.join('')}</ul>`
    : `<p class="glance-empty">${empty}</p>`;

export const atAGlance = (portfolio: Portfolio, now: number) => {
  const attention = portfolio.attention.map(({ pkg, reason }) =>
    reason === 'dormant'
      ? `<li>${link(pkg.name)}<span class="muted">no release ${ago(pkg.lastPublishMs, now).replace(' ago', '')}</span></li>`
      : `<li>${link(pkg.name)}<span class="is-down">${formatChange(pkg.change)}</span></li>`
  );
  const doingWell = portfolio.doingWell.map(
    (pkg) =>
      `<li>${link(pkg.name)}<span class="is-up">${formatChange(pkg.change)}</span></li>`
  );
  const dormant = portfolio.dormant
    .slice(0, 4)
    .map(
      (pkg) =>
        `<li>${link(pkg.name)}<span class="muted">${ago(pkg.lastPublishMs, now)}</span></li>`
    );

  return `<section class="user-section" aria-labelledby="glance-title">
  <div class="user-section-head"><h2 id="glance-title">At a glance</h2><span class="user-label">From the last complete month</span></div>
  <div class="glance">
    <div class="user-card glance-card"><h3><span class="tone is-down" aria-hidden="true"></span>Needs attention</h3><p class="glance-why">Still used but not released in a year, or falling fast</p>${glanceList(attention, 'Nothing needs attention.')}</div>
    <div class="user-card glance-card"><h3><span class="tone is-up" aria-hidden="true"></span>Doing well</h3><p class="glance-why">Growing since the month before</p>${glanceList(doingWell, 'Nothing grew this month.')}</div>
    <div class="user-card glance-card"><h3><span class="tone is-dormant" aria-hidden="true"></span>Dormant</h3><p class="glance-why">${countPackages(portfolio.dormant.length)} with no release in a year</p>${glanceList(dormant, 'Every package had a release this year.')}</div>
  </div>
</section>`;
};

const tile = (pkg: PortfolioPackage, now: number) =>
  `<li class="user-card pkg-tile">
  <span class="pkg-tile-name">${link(pkg.name)}</span><span class="pkg-tile-downloads num">${compact.format(pkg.monthly)}</span>
  <span class="pkg-tile-meta">${pkg.version ? `v${escapeHtml(pkg.version)} · ` : ''}${ago(pkg.lastPublishMs, now)} ${flags(pkg)}</span><span class="pkg-tile-change ${changeClass(pkg.change)}">${formatChange(pkg.change)}</span>
  <span class="pkg-tile-spark">${sparkline(pkg.series, { label: `${pkg.name}, monthly downloads`, down: (pkg.change ?? 0) < 0 })}</span>
</li>`;
const state = (pkg: PortfolioPackage) =>
  [
    (pkg.change ?? 0) > 0 ? 'growing' : '',
    (pkg.change ?? 0) < 0 ? 'declining' : '',
    pkg.dormant ? 'dormant' : ''
  ]
    .filter(Boolean)
    .join(' ');
const row = (pkg: PortfolioPackage, now: number) =>
  `<tr data-name="${escapeAttr(pkg.name.toLowerCase())}" data-keywords="${escapeAttr(pkg.keywords.join(' ').toLowerCase())}" data-state="${state(pkg)}" data-downloads="${pkg.monthly}" data-change="${pkg.change ?? ''}" data-last="${pkg.lastPublishMs ?? 0}" data-releases="${pkg.releasesLastYear}">
  <td class="col-name">${link(pkg.name, 'pkg-name')}<span class="pkg-desc">${escapeHtml(pkg.description)}</span></td>
  <td class="col-spark">${sparkline(pkg.series, { label: `${pkg.name}, monthly downloads`, down: (pkg.change ?? 0) < 0 })}</td>
  <td class="col-downloads num">${full.format(pkg.monthly)}</td>
  <td class="col-change num ${changeClass(pkg.change)}">${formatChange(pkg.change)}</td>
  <td class="col-version num">${pkg.version ? escapeHtml(pkg.version) : ''}</td>
  <td class="col-last">${ago(pkg.lastPublishMs, now)}</td>
  <td class="col-releases num">${pkg.releasesLastYear}</td>
  <td class="col-flags">${flags(pkg)}</td>
</tr>`;
const sortHeader = (key: string, text: string, sorted = false) =>
  `<th scope="col" class="col-${key}"${sorted ? ' aria-sort="descending"' : ''}><button type="button" class="sort-button" data-sort="${key}">${text}</button></th>`;

export const packagesSection = (
  portfolio: Portfolio,
  now: number,
  view: 'scope' | 'table'
) => {
  const { packages, scopes } = portfolio;
  const count = (s: string) =>
    packages.filter((pkg) => state(pkg).split(' ').includes(s)).length;
  const groups = scopes
    .map(
      (group) => `<div class="pkg-group">
  <div class="pkg-group-head"><h3>${escapeHtml(group.scope)}</h3><span class="muted">${countPackages(group.packages.length)}</span><span class="pkg-group-sum num">${full.format(group.monthly)} downloads a month</span></div>
  <ul class="pkg-tiles">${group.packages.map((pkg) => tile(pkg, now)).join('')}</ul>
</div>`
    )
    .join('');
  const chip = (filter: string, text: string, n: number, pressed = false) =>
    `<button type="button" class="filter-chip" data-filter="${filter}" aria-pressed="${pressed}">${text} <span class="n">${n}</span></button>`;

  return `<section class="user-section" aria-labelledby="packages-title">
  <div class="user-section-head">
    <h2 id="packages-title">Packages</h2>
    <div class="segmented" role="group" aria-label="Show packages">
      <button type="button" id="view-scope" aria-pressed="${view === 'scope'}">By scope</button><button type="button" id="view-table" aria-pressed="${view === 'table'}">Table</button>
    </div>
  </div>
  <div id="packages-by-scope"${view === 'scope' ? '' : ' hidden'}>${groups}</div>
  <div id="packages-table"${view === 'table' ? '' : ' hidden'}>
    <div class="pkg-toolbar">
      <label class="pkg-filter"><span class="visually-hidden">Filter packages</span><input type="search" id="package-filter" class="pkg-filter-input" placeholder="Filter by name or keyword" autocomplete="off"></label>
      ${chip('all', 'All', packages.length, true)}${chip('growing', 'Growing', count('growing'))}${chip('declining', 'Declining', count('declining'))}${chip('dormant', 'Dormant', count('dormant'))}
      <span class="pkg-shown" aria-live="polite"><span id="package-count">${packages.length}</span> shown</span>
    </div>
    <div class="user-card pkg-table-card">
      <table class="pkg-table">
        <caption class="visually-hidden">All packages, sortable by column</caption>
        <thead><tr>${sortHeader('name', 'Package')}<th scope="col" class="col-spark">12 months</th>${sortHeader('downloads', 'Downloads', true)}${sortHeader('change', 'Change')}<th scope="col" class="col-version">Version</th>${sortHeader('last', 'Last release')}${sortHeader('releases', 'Releases')}<th scope="col" class="col-flags"><span class="visually-hidden">Flags</span></th></tr></thead>
        <tbody id="package-rows">${packages.map((pkg) => row(pkg, now)).join('')}</tbody>
      </table>
    </div>
  </div>
</section>`;
};

export const topics = (portfolio: Portfolio) =>
  portfolio.topics.length
    ? `<section class="user-section" aria-labelledby="topics-title">
  <div class="user-section-head"><h2 id="topics-title">Topics</h2><span class="user-label">The keywords used most across these packages</span></div>
  <ul class="user-topics">${portfolio.topics.map((t) => `<li><a href="https://www.npmjs.com/search?q=keywords:${encodeURIComponent(t.keyword)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.keyword)} <span class="n">${t.count}</span></a></li>`).join('')}</ul>
</section>`
    : '';
