import { sparkline } from '../../components/media/Charts';
import { getInitialsForUser } from '../../components/page-section/Header/utils/get-initials-for-user';
import { monthName } from '../../utils/downloads';
import { escapeAttr, escapeHtml } from '../../utils/escape-html';
import { ago } from '../user/sections';

import type { PackageInfo, UserInfo } from './enrich';
import type { LookupKind, Lookups } from './lookups';

// The discovery pages in the showcase design (#62). Plain template strings,
// not `html`, so Prettier never splits an end tag over two lines, which
// diff-dom can't read (#64). Everything from npm and the lookups is escaped.

const full = new Intl.NumberFormat('en-US');
const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});
const TEXT = {
  package: {
    title: 'Packages',
    lede: 'Look up any npm package: downloads, health and security. Or see what other people looked up.',
    label: 'Package name',
    placeholder: 'Try @phun-ky/speccer or vitest',
    path: 'packages',
    notFound: 'No npm package called'
  },
  user: {
    title: 'Users',
    lede: 'Look up anyone who publishes to npm: every package they maintain, on one page. Or see who other people looked up.',
    label: 'npm username',
    placeholder: 'Try phun-ky or sindresorhus',
    path: 'users',
    notFound: 'No npm user with packages called'
  }
} as const;
const href = (kind: LookupKind, term: string) =>
  `/${TEXT[kind].path}/${escapeAttr(term)}`;
const people = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`;

/** A sentence for a search that found nothing, or empty. */
export const notFoundText = (kind: LookupKind, term: string) =>
  term ? `${TEXT[kind].notFound} “${term}”.` : '';

export const discoverHead = (kind: LookupKind, query = '') => {
  const text = TEXT[kind];

  return `<div class="discover-head">
  <span class="discover-eyebrow">Discover</span>
  <h1>${text.title}</h1>
  <p class="discover-lede">${text.lede}</p>
  <form class="discover-search" role="search" data-no-submit>
    <label class="visually-hidden" for="discover-query">${text.label}</label>
    <svg class="discover-search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>
    <input type="search" id="discover-query" class="discover-search-input" value="${escapeAttr(query)}" placeholder="${text.placeholder}" autocomplete="off" data-lpignore="true">
    <button type="submit" id="discover-submit" class="pill-button is-primary">Show me</button>
  </form>
  <p id="discover-status" class="discover-status" role="status">${escapeHtml(notFoundText(kind, query))}</p>
</div>`;
};

export const trending = (kind: LookupKind, terms: string[]) =>
  terms.length
    ? `<div class="discover-trending"><span class="discover-trending-label"><span class="tone is-up" aria-hidden="true"></span>Trending in the last 24 hours</span><ul class="discover-chips">${terms.map((term) => `<li><a href="${href(kind, term)}" data-link>${escapeHtml(term)}</a></li>`).join('')}</ul></div>`
    : '<p class="discover-trending"><span class="discover-trending-label"><span class="tone is-dormant" aria-hidden="true"></span>Nothing trending in the last 24 hours</span></p>';

const packageTile = (
  term: string,
  peopleCount: number,
  pkg: PackageInfo | undefined
) => {
  const down =
    pkg && pkg.series.length > 1 && pkg.series.at(-1)! < pkg.series.at(-2)!;

  return `<li class="user-card discover-tile">
  <div class="discover-tile-top"><a href="${href('package', term)}" data-link class="discover-name">${escapeHtml(term)}</a>${pkg ? `<span class="discover-big" title="Downloads in ${pkg.month ? monthName(pkg.month) : 'the last complete month'}">${compact.format(pkg.monthly)}</span>` : ''}</div>
  <p class="discover-desc">${escapeHtml(pkg?.description ?? '')}</p>
  ${pkg ? `<span class="discover-spark">${sparkline(pkg.series, { label: `${term}, monthly downloads`, down })}</span>` : ''}
  <span class="discover-meta">${pkg?.version ? `v${escapeHtml(pkg.version)} · ` : ''}looked up by ${people(peopleCount)}</span>
</li>`;
};
const countPackages = (n: number) =>
  `${full.format(n)} ${n === 1 ? 'package' : 'packages'}`;
// Like the user page, which loads up to 500 packages (#96)
const userPackages = (user: UserInfo) =>
  user.shown < user.packages
    ? `${full.format(user.shown)} of ${countPackages(user.packages)}`
    : countPackages(user.packages);
const userTile = (
  term: string,
  peopleCount: number,
  user: UserInfo | undefined
) => `<li class="user-card discover-tile">
  <div class="discover-tile-top"><span class="user-avatar discover-avatar" aria-hidden="true">${escapeHtml(getInitialsForUser(term))}</span><a href="${href('user', term)}" data-link class="discover-name">${escapeHtml(term)}</a>${user ? `<span class="discover-big" title="Downloads in the last 30 days, ${user.shown < user.packages ? userPackages(user) : 'all packages'}, from npm's search">${compact.format(user.monthly)}</span>` : ''}</div>
  ${user ? `<p class="discover-meta">${userPackages(user)}, ${compact.format(user.monthly)} downloads in 30 days${user.shown < user.packages ? ' for those' : ''}</p><ul class="discover-tops" aria-label="Top packages">${user.top.map((name) => `<li><a href="${href('package', name)}" data-link>${escapeHtml(name)}</a></li>`).join('')}</ul>` : ''}
  <span class="discover-meta">looked up by ${people(peopleCount)}</span>
</li>`;

export const mostLookedUp = (
  kind: LookupKind,
  popular: Lookups['popular'],
  packages: Map<string, PackageInfo>,
  users: Map<string, UserInfo>
) => `<section class="user-section" aria-labelledby="popular-title">
  <div class="user-section-head"><h2 id="popular-title">Most looked up</h2><span class="user-label">By the number of people who looked them up</span></div>
  ${
    popular.length
      ? `<ul class="discover-tiles">${popular.map(({ term, people: n }) => (kind === 'package' ? packageTile(term, n, packages.get(term)) : userTile(term, n, users.get(term)))).join('')}</ul>`
      : '<p class="discover-empty">Nothing looked up yet. Search above, and it shows here.</p>'
  }
</section>`;

export const latest = (
  kind: LookupKind,
  rows: Lookups['latest'],
  now: number
) =>
  rows.length
    ? `<section class="user-section" aria-labelledby="latest-title">
  <div class="user-section-head"><h2 id="latest-title">Latest lookups</h2></div>
  <ul class="discover-chips">${rows.map(({ term, at }) => `<li><a href="${href(kind, term)}" data-link>${escapeHtml(term)}</a><span>${ago(at, now)}</span></li>`).join('')}</ul>
</section>`
    : '';
