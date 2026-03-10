import Highcharts from 'highcharts/esm/highcharts.js';

import type { NpmPackageName } from '../../../types';
import { compactNumberFormat } from '../../../utils/number-format';
// import { rollingMedian } from '../../../features/package-chart/utils/rolling-median';

export type RenderPackagePageDownloadsChartPropsType = {
  pkgName: NpmPackageName;
  containerId: string;
  series: [number, number][];
};

/**
 * Render download statistics in the DOM.
 */
export const renderPackagePageDownloadsChart = (
  props: RenderPackagePageDownloadsChartPropsType
) => {
  const { pkgName, containerId, series = [] } = props;

  if (!document.getElementById(containerId)) return;

  try {
    const chartOptions: Highcharts.Options = {
      chart: {
        type: 'areaspline',
        margin: [16, 0, 32, 56],
        backgroundColor: 'rgba(255,255,255,0)'
      },
      legend: {
        enabled: false
      },
      title: { text: undefined },
      xAxis: {
        gridLineColor: 'rgba(255,255,255,0.05)',

        type: 'datetime',

        // Ensure we get nice month ticks even for sparse data
        tickInterval: 30 * 24 * 3600 * 1000, // monthly-ish fallback
        tickmarkPlacement: 'on',
        lineColor: 'rgba(255,255,255,0.05)',
        tickColor: 'rgba(255,255,255,0.05)',
        tickPositioner: function () {
          const e = this.getExtremes(); // { min, max, dataMin, dataMax, ... }
          // Prefer the "data" extremes; fall back to axis extremes
          const min = e.dataMin ?? e.min;
          const max = e.dataMax ?? e.max;

          if (typeof min !== 'number' || typeof max !== 'number') {
            return this.tickPositions || []; // let Highcharts keep defaults if available
          }

          const positions: number[] = [];
          const d = new Date(min);

          d.setUTCDate(1);
          d.setUTCHours(0, 0, 0, 0);

          if (d.getTime() < min) d.setUTCMonth(d.getUTCMonth() + 1);

          while (d.getTime() <= max) {
            positions.push(d.getTime());
            d.setUTCMonth(d.getUTCMonth() + 1);
          }

          return positions;
        },
        labels: {
          enabled: true,
          // Pick one:
          format: '{value:%b}', // Jan, Feb, ...
          // format: '{value:%b %Y}',   // Jan 2026
          // format: '{value:%m}',      // 01..12
          style: { color: 'rgba(255,255,255,0.2)' }
        }
      },
      yAxis: {
        title: {
          text: undefined
        },
        gridLineColor: 'rgba(255,255,255,0.05)',

        tickAmount: 4, // try 3–6 depending on height
        labels: {
          enabled: true,
          style: { color: 'rgba(255,255,255,0.2)' },
          formatter() {
            return compactNumberFormat.format(Number(this.value));
          }
        }
      },

      plotOptions: {
        areaspline: {
          fillOpacity: 1,
          marker: { enabled: false }
        }
      },
      series: [
        {
          name: 'Downloads',
          data: series,
          color: 'var(--package-color)',
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, 'var(--package-color-gradient-start)'],
              [1, 'var(--package-color-gradient-stop)']
            ]
          }
        }
      ],
      credits: { enabled: false }
    };

    if (!document.getElementById(containerId)) return;

    Highcharts.chart(containerId, chartOptions);
  } catch (err) {
    console.warn(`Chart error for ${pkgName}:`, err);
  }
};
