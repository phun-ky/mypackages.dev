import { areaChart, releaseHeatmap, ring } from '../../components/media/Charts';
import { getInitialsForUser } from '../../components/page-section/Header/utils/get-initials-for-user';
import type { Health } from '../../services/package/health';
import { dayName, monthName } from '../../utils/downloads';
import { escapeAttr, escapeHtml } from '../../utils/escape-html';

import { ago, type SignalRow } from './report';

// The package page as a report card (#61). Plain template strings, not
// `html`, so Prettier never splits an end tag over two lines, which diff-dom
// can't read (#64). Everything from npm, GitHub or OSV is escaped, and links
// only use http(s) URLs (`safeUrl`, applied by the page).

export type ReportData = {
  name: string;
  description: string;
  version: string;
  license: string | null;
  types: boolean;
  esm: boolean;
  attested: boolean;
  enginesNode: string | null;
  deprecated: string | null;
  dependencies: number;
  devDependencies: number;
  peerDependencies: number;
  installSize: string | null;
  fileCount: number | null;
  maintainers: string[];
  lastPublishMs: number | null;
  health: Health | null;
  rows: SignalRow[];
  verdict: string;
  // Downloads in the last of `months`
  lastMonth: number;
  change: number | null;
  months: { month: string; downloads: number }[];
  weeks: { start: string; downloads: number }[];
  /** The last day npm's data has, like `2026-10-28` */
  dataEnd: string | null;
  releases: { version: string; ms: number }[];
  releasesLastYear: number[];
  links: { repository?: string; homepage?: string; bugs?: string };
  openIssues: number | null;
  stars: number | null;
  keywords: string[];
};

const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});
const dayFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});
const userLink = (name: string) =>
  `<a href="/users/${escapeAttr(name)}" data-link>${escapeHtml(name)}</a>`;
const chip = (text: string, className = '') =>
  `<li class="report-chip${className ? ` ${className}` : ''}">${escapeHtml(text)}</li>`;

export const reportHead = (d: ReportData, now: number) => {
  const [owner, ...others] = d.maintainers;
  const by = owner
    ? `Package by ${userLink(owner)}${others.length ? ` and ${others.length} more` : ''}`
    : 'Package';
  const updated = d.lastPublishMs
    ? ` · updated ${ago(d.lastPublishMs, now)}`
    : '';
  const chips = [
    chip(`v${d.version}`),
    d.license ? chip(d.license) : '',
    d.types ? chip('TypeScript types') : '',
    chip(d.esm ? 'ESM' : 'CommonJS'),
    d.attested ? chip('Provenance') : '',
    d.enginesNode ? chip(`Node ${d.enginesNode}`) : '',
    chip(
      d.dependencies === 0
        ? 'No dependencies'
        : `${d.dependencies} ${d.dependencies === 1 ? 'dependency' : 'dependencies'}`
    ),
    d.deprecated ? chip('Deprecated', 'is-deprecated') : ''
  ].join('');
  const deprecated = d.deprecated
    ? `<p class="report-deprecated" role="note"><strong>Deprecated:</strong> ${escapeHtml(d.deprecated)}</p>`
    : '';

  return `<div class="report-head">
  <p class="report-owner">${by}${updated}</p>
  <h1>${escapeHtml(d.name)}</h1>
  <p class="description">${escapeHtml(d.description)}</p>
  <ul class="report-chips" aria-label="About this package">${chips}</ul>
  ${deprecated}
  <div class="report-install"><code id="install-command">npm i ${escapeHtml(d.name)}</code><button type="button" id="copy-install" class="report-copy" aria-label="Copy the install command"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button></div>
</div>`;
};

export const notice = (signedIn: boolean) =>
  `<p class="report-notice" role="note"><strong>This site is in alpha.</strong> ${
    signedIn
      ? 'npm limits how much the site can fetch without your npm token, so some numbers may be missing. <a href="/profile/secrets/new" data-link>Add an npm token</a>'
      : 'npm limits how much the site can fetch for signed-out visitors, so some numbers may be missing. <a href="/dashboard/signin" data-link>Sign in</a> and add an npm token for complete data.'
  }</p>`;

export const verdictCard = (d: ReportData) => {
  if (!d.health) {
    return '<section class="report-card report-verdict" aria-labelledby="verdict-title"><div><span class="report-label">Package health</span><h2 id="verdict-title">Not available</h2><p>The downloads for this package couldn\'t be fetched, so its health couldn\'t be worked out. Try again later.</p></div></section>';
  }

  const rows = d.rows
    .map(
      (row) =>
        `<li><span class="signal-name">${row.name}</span><span class="signal-bar" aria-hidden="true"><i style="width:${Math.round(row.scorePct)}%"></i></span><span class="signal-score">${Math.round(row.scorePct)}</span><span class="signal-reason">${escapeHtml(row.reason)}</span></li>`
    )
    .join('');

  return `<section class="report-card report-verdict" aria-labelledby="verdict-title">
  ${ring(d.health.scorePct, { label: 'Package health' })}
  <div class="report-summary"><span class="report-label">Package health</span><h2 id="verdict-title">${d.health.label}</h2><p>${escapeHtml(d.verdict)}</p></div>
  <ul class="signals" aria-label="What the score is made of">${rows}</ul>
  <p class="report-how"><a href="/help/faq#how-is-package-health-worked-out" data-link>How the score is worked out</a> · ${Math.round(d.health.confidencePct)}% of the data was available</p>
</section>`;
};

const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleString('en-GB', {
    month: 'short',
    timeZone: 'UTC'
  });

export const usage = (d: ReportData) => {
  if (!d.months.length) {
    return '<section class="report-section" aria-labelledby="usage-title"><h2 id="usage-title">Usage</h2><p class="report-lead">The downloads for this package couldn\'t be fetched.</p></section>';
  }

  const best = Math.max(...d.months.map((m) => m.downloads));
  const change =
    d.change === null || !Number.isFinite(d.change)
      ? ''
      : `<span class="${d.change >= 0 ? 'is-up' : 'is-down'}">${d.change >= 0 ? '▲' : '▼'} ${Math.abs(d.change).toFixed(1)}% month over month</span>`;
  const weeks = d.weeks.length
    ? areaChart(
        d.weeks.map((w) => w.downloads),
        d.weeks.map((w, i) =>
          i % 9 === 0
            ? new Date(`${w.start}T00:00:00Z`).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                timeZone: 'UTC'
              })
            : ''
        ),
        { label: `Downloads per week, the last ${d.weeks.length} weeks` }
      )
    : '';

  return `<section class="report-section" aria-labelledby="usage-title">
  <h2 id="usage-title">Usage</h2>
  <p class="report-lead">Downloads from npm, the last ${d.months.length} complete months${d.dataEnd ? `, with data up to ${dayName(d.dataEnd)}` : ''}</p>
  <div class="usage-top"><span class="report-big" title="Downloads in ${monthName(d.months.at(-1)!.month)}">${compact.format(d.lastMonth)}</span><span class="muted">in ${monthName(d.months.at(-1)!.month)}</span>${change}<span class="muted">Best month ${compact.format(best)}</span>
    <div class="segmented" role="group" aria-label="Downloads per"><button type="button" id="chart-month" aria-pressed="true">Month</button><button type="button" id="chart-week" aria-pressed="false">Week</button></div>
  </div>
  <div class="report-card report-chart">
    <div id="chart-months">${areaChart(
      d.months.map((m) => m.downloads),
      d.months.map((m) => monthLabel(m.month)),
      {
        label: `Downloads per month, the last ${d.months.length} complete months`
      }
    )}</div>
    <div id="chart-weeks" hidden>${weeks}</div>
  </div>
</section>`;
};

export const releasesSection = (d: ReportData, now: number) => {
  const first = d.releases[d.releases.length - 1];
  const lead = first
    ? `${d.releasesLastYear.length} ${d.releasesLastYear.length === 1 ? 'release' : 'releases'} in the last year, ${d.releases.length} in all since ${new Date(first.ms).getFullYear()}`
    : 'No releases found';
  const recent = d.releases
    .slice(0, 5)
    .map(
      (r, i) =>
        `<li><span class="version">${escapeHtml(r.version)}</span>${i === 0 ? '<span class="report-chip is-latest">latest</span>' : ''}<span class="muted">${dayFormat.format(new Date(r.ms))}</span></li>`
    )
    .join('');

  return `<section class="report-section" aria-labelledby="releases-title">
  <h2 id="releases-title">Releases</h2>
  <p class="report-lead">${lead}</p>
  <div class="report-card report-pad">${releaseHeatmap(d.releasesLastYear, { label: `${d.releasesLastYear.length} releases in the last year`, now })}</div>
  ${recent ? `<ol class="report-card report-pad versions" aria-label="Recent versions">${recent}</ol>` : ''}
</section>`;
};

export const needs = (d: ReportData) => {
  const deps =
    d.dependencies === 0
      ? ['No runtime dependencies', `${d.devDependencies} for development only`]
      : [
          `${d.dependencies} runtime ${d.dependencies === 1 ? 'dependency' : 'dependencies'}`,
          `Plus ${d.devDependencies} for development${d.peerDependencies ? ` and ${d.peerDependencies} peer` : ''}`
        ];
  const runtime = [
    d.enginesNode ? `Node ${d.enginesNode}` : 'Any Node version',
    [
      d.esm ? 'ESM' : 'CommonJS',
      d.types ? 'with TypeScript types' : 'without types'
    ].join(', ')
  ];
  const size = [
    d.installSize ?? 'Size unknown',
    d.fileCount ? `${d.fileCount} files when installed` : 'Unpacked size'
  ];

  return `<section class="report-section" aria-labelledby="needs-title">
  <h2 id="needs-title">What it needs</h2>
  <p class="report-lead">Before you add it to a project</p>
  <ul class="needs">${[deps, runtime, size].map(([title, sub]) => `<li class="report-card"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(sub)}</span></li>`).join('')}</ul>
</section>`;
};

const linkRow = (text: string, url: string | undefined, note: string) =>
  url
    ? `<li><a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${text}</a><span class="muted">${escapeHtml(note)}</span></li>`
    : '';
const shortUrl = (url?: string) => {
  try {
    if (!url) return '';

    const { host, pathname } = new URL(url);

    return `${host.replace(/^www\./, '')}${pathname.replace(/(\.git)?\/?$/, '')}`;
  } catch {
    return '';
  }
};

export const linksAndMaintainers = (d: ReportData) => {
  const links = [
    linkRow('Repository', d.links.repository, shortUrl(d.links.repository)),
    linkRow('Homepage', d.links.homepage, shortUrl(d.links.homepage)),
    linkRow(
      'Issues',
      d.links.bugs,
      d.openIssues === null ? shortUrl(d.links.bugs) : `${d.openIssues} open`
    ),
    linkRow(
      'Advisories',
      `https://osv.dev/list?q=${encodeURIComponent(d.name)}&ecosystem=npm`,
      'osv.dev'
    ),
    linkRow('npm', `https://www.npmjs.com/package/${d.name}`, 'npmjs.com')
  ].join('');
  const people = d.maintainers
    .map(
      (name) =>
        `<li><span class="report-avatar" aria-hidden="true">${escapeHtml(getInitialsForUser(name))}</span>${userLink(name)}</li>`
    )
    .join('');
  const stars =
    d.stars === null
      ? ''
      : `<p class="muted report-stars">${d.stars} ${d.stars === 1 ? 'star' : 'stars'} on GitHub</p>`;

  return `<section class="report-section" aria-labelledby="links-title">
  <h2 id="links-title">Links and maintainers</h2>
  <div class="report-two">
    <ul class="report-card report-pad report-links">${links}</ul>
    <div class="report-card report-pad"><span class="report-label">Maintainers</span><ul class="report-people">${people || '<li class="muted">None listed</li>'}</ul>${stars}</div>
  </div>
</section>`;
};

export const keywords = (d: ReportData) =>
  d.keywords.length
    ? `<section class="report-section" aria-labelledby="keywords-title"><h2 id="keywords-title">Keywords</h2><ul class="report-keywords" id="keywords">${d.keywords.map((k) => `<li><a href="https://www.npmjs.com/search?q=keywords:${encodeURIComponent(k)}" target="_blank" rel="noopener noreferrer">${escapeHtml(k)}</a></li>`).join('')}</ul></section>`
    : '';
