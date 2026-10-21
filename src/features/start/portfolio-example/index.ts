import { Link } from '../../../components/actions/Link';
import { addOnAfterAppRender } from '../../../lib/spa';
import { supabase } from '../../../services/supabase';
import { escapeAttr, escapeHtml } from '../../../utils/escape-html';
import './styles/portfolioExample.css';

const html = String.raw;
// The portfolio computed once a day by the portfolio-snapshot function (#67)
const EXAMPLE_USER = 'phun-ky';

type Snapshot = {
  computed_at: string;
  package_count: number;
  monthly_downloads: number;
  change_pct: number | null;
  months: { month: string; downloads: number }[];
  top_packages: { name: string; monthly: number; change_pct: number | null }[];
};

// 1.9M, as on the user page
const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});
const day = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' });
const change = (pct: number | null) => {
  if (pct === null || !Number.isFinite(pct)) return '';

  const up = pct >= 0;
  const text = `${up ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}%`;
  const said = up ? 'up' : 'down';

  // One line per element: diff-dom misreads split end tags (#64)
  return `<span class="change ${up ? 'is-up' : 'is-down'}">${text}<span class="visually-hidden"> ${said}</span> month over month</span>`;
};
/** A line through the monthly totals, scaled to their own range. */
const sparkline = (values: number[]) => {
  if (values.length < 2) return '';

  const w = 240;
  const h = 56;
  const min = Math.min(...values) * 0.95;
  const max = Math.max(...values) * 1.05;
  const points = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - ((v - min) / (max - min || 1)) * h
  ]);
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`);

  return html`<svg
    class="sparkline"
    viewBox="0 0 ${w} ${h}"
    preserveAspectRatio="none"
    role="img"
    aria-label="Monthly downloads for the last ${values.length} months"
  >
    <polygon
      class="sparkline-area"
      points="0,${h} ${line.join(' ')} ${w},${h}"
    />
    <polyline class="sparkline-line" points="${line.join(' ')}" />
  </svg>`;
};
const render = (snapshot: Snapshot) =>
  html`<div class="example-grid">
      <div class="example-card">
        <span class="label">Monthly downloads, all packages</span>
        <span class="big">${compact.format(snapshot.monthly_downloads)}</span>
        ${change(snapshot.change_pct)}
      </div>
      <div class="example-card">
        <span class="label">Packages</span>
        <span class="big">${snapshot.package_count}</span>
        <span class="muted">authored or maintained</span>
      </div>
      <div class="example-card">
        <span class="label">Last 12 months</span>
        ${sparkline(snapshot.months.map((m) => m.downloads))}
      </div>
      <div class="example-card">
        <span class="label">Most downloaded</span>
        <ol class="top-packages">
          ${snapshot.top_packages
            .map(
              (pkg) =>
                html`<li>
                  ${Link({
                    to: `/packages/${pkg.name}`,
                    children: escapeHtml(pkg.name)
                  })}<span>${compact.format(pkg.monthly)}</span>
                </li>`
            )
            .join('')}
        </ol>
      </div>
    </div>
    <p class="example-note">
      Numbers from ${day.format(new Date(snapshot.computed_at))}, updated daily.
    </p>`;

/**
 * "What one search gets you": a real portfolio, read from one row instead
 * of computed from npm on every visit.
 */
export const PortfolioExample = () => {
  addOnAfterAppRender(async () => {
    const element = document.getElementById('portfolio-example');

    if (!element || element.dataset.loaded) return;

    const { data } = await supabase
      .from('portfolio_snapshots')
      .select(
        'computed_at, package_count, monthly_downloads, change_pct, months, top_packages'
      )
      .eq('username', EXAMPLE_USER)
      .maybeSingle();

    element.dataset.loaded = 'true';

    // Without a snapshot, the section says what the page shows instead
    element.innerHTML = data
      ? render(data as Snapshot)
      : html`<p class="example-note">
          Search for a user to see their downloads, packages and trends.
        </p>`;
  });

  return html`<section class="start-section" aria-labelledby="example-title">
    <div class="section-head">
      <h2 id="example-title">What one search gets you</h2>
      ${Link({
        to: `/users/${escapeAttr(EXAMPLE_USER)}`,
        children: `See the full page for ${EXAMPLE_USER} →`
      })}
    </div>
    <div id="portfolio-example" class="portfolio-example" aria-live="polite">
      <p class="example-note">Loading the example…</p>
    </div>
  </section>`;
};
