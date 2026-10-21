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
  const max = Math.max(...values) * 1.1 || 1;
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
