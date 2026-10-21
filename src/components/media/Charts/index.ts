import { escapeAttr } from '../../../utils/escape-html';
import './styles/charts.css';

// Small SVG charts coloured from the theme tokens (see charts.css), for
// places where Highcharts is more than the job needs. Plain strings, so
// Prettier never splits an end tag over two lines, which diff-dom can't
// read (#64).

const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});
const points = (values: number[], w: number, h: number, floor: number) => {
  const max = Math.max(...values);

  return values.map((v, i) => [
    (i / Math.max(values.length - 1, 1)) * w,
    h - 2 - ((v - floor) / (max - floor || 1)) * (h - 4)
  ]);
};

/**
 * A line with an area under it, scaled to the values' own range so the
 * shape shows. `down` colours it as falling.
 */
export const sparkline = (
  values: number[],
  { label, down = false }: { label: string; down?: boolean }
) => {
  if (values.length < 2) return '';

  const w = 120;
  const h = 32;
  const line = points(values, w, h, Math.min(...values))
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');

  return `<svg class="sparkline${down ? ' is-down' : ''}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${escapeAttr(label)}"><polygon class="sparkline-area" points="0,${h} ${line} ${w},${h}"/><polyline class="sparkline-line" points="${line}"/></svg>`;
};

/** A round top for the axis, so the halfway line is a round number too */
const niceTop = (value: number) => {
  if (value <= 0) return 1;

  const half = value / 2;
  const magnitude = 10 ** Math.floor(Math.log10(half));
  const step = [1, 2, 2.5, 5, 10].find((n) => n * magnitude >= half) ?? 10;

  return step * magnitude * 2;
};

/** Monthly totals from zero, with a light grid and month labels. */
export const areaChart = (
  values: number[],
  labels: string[],
  { label }: { label: string }
) => {
  if (values.length < 2) return '';

  const w = 900;
  const h = 200;
  const pad = { l: 48, r: 8, t: 10, b: 26 };
  const max = niceTop(Math.max(...values));
  const x = (i: number) =>
    pad.l + (i / (values.length - 1)) * (w - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
  const line = values
    .map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(' ');
  const grid = [0, 0.5, 1]
    .map(
      (f) =>
        `<line class="chart-grid" x1="${pad.l}" x2="${w - pad.r}" y1="${y(max * f)}" y2="${y(max * f)}"/><text class="chart-label" x="${pad.l - 8}" y="${y(max * f) + 4}" text-anchor="end">${compact.format(max * f)}</text>`
    )
    .join('');
  const months = labels
    .map(
      (l, i) =>
        `<text class="chart-label" x="${x(i)}" y="${h - 6}" text-anchor="middle">${escapeAttr(l)}</text>`
    )
    .join('');

  return `<svg class="area-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeAttr(label)}">${grid}${months}<polygon class="sparkline-area" points="${pad.l},${h - pad.b} ${line} ${w - pad.r},${h - pad.b}"/><polyline class="sparkline-line" points="${line}"/></svg>`;
};

/** A score from 0 to 100 as a ring, with the number in the middle */
export const ring = (scorePct: number, { label }: { label: string }) => {
  const size = 132;
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const score = Math.round(Math.min(Math.max(scorePct, 0), 100));

  return `<svg class="score-ring" viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeAttr(label)}: ${score} of 100"><circle class="score-ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="12" fill="none"/><circle class="score-ring-value" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="12" fill="none" stroke-dasharray="${((c * score) / 100).toFixed(1)} ${c.toFixed(1)}" stroke-linecap="round" transform="rotate(-90 ${size / 2} ${size / 2})"/><text class="score-ring-number" x="50%" y="50%" dy="0.35em" text-anchor="middle">${score}</text></svg>`;
};

/**
 * One square per day for the last 53 weeks, filled on days with a release,
 * weeks as columns like GitHub's contribution graph.
 */
export const releaseHeatmap = (
  days: number[],
  { label, now = Date.now() }: { label: string; now?: number }
) => {
  const DAY = 24 * 60 * 60 * 1000;
  const counts = new Map<string, number>();

  for (const ms of days) {
    const day = new Date(ms).toISOString().slice(0, 10);

    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  // Start on the Sunday 52 weeks back, so the columns are weeks
  const first = new Date(now - 364 * DAY);
  const start = first.getTime() - first.getUTCDay() * DAY;
  const cells: string[] = [];

  for (let i = 0; start + i * DAY <= now; i++) {
    const day = new Date(start + i * DAY).toISOString().slice(0, 10);
    const n = counts.get(day) ?? 0;

    cells.push(
      `<rect class="heat-${Math.min(n, 2)}" x="${Math.floor(i / 7) * 14}" y="${(i % 7) * 14}" width="11" height="11" rx="2"><title>${day}: ${n} ${n === 1 ? 'release' : 'releases'}</title></rect>`
    );
  }

  return `<svg class="release-heatmap" viewBox="0 0 ${53 * 14} ${7 * 14}" role="img" aria-label="${escapeAttr(label)}">${cells.join('')}</svg>`;
};
