import Highcharts from 'highcharts/esm/highcharts.js';

import 'highcharts/esm/modules/heatmap';
import type { NpmPackageName } from '../../../types';
import type { HeatmapPoint } from '../build-publish-heatmap-series';

export type RenderActivityChartParamsType = {
  pkgName: NpmPackageName;
  containerId: string;
  activityHeatMapSeries: {
    series: HeatmapPoint[];
    totalDays: number;
    xCategories: string[];
    yCategories: string[];
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const zOf = (p: HeatmapPoint) => (Array.isArray(p) ? p[2] : (p as any).value); // adjust if your HeatmapPoint shape is known

export const renderActivityChart = (props: RenderActivityChartParamsType) => {
  const { pkgName, containerId, activityHeatMapSeries } = props;
  const el = document.getElementById(containerId);

  if (!el) return;

  const { series, xCategories, yCategories } = activityHeatMapSeries;

  try {
    const allZero =
      series.length > 0 && series.every((p) => (zOf(p) ?? 0) === 0);
    const chartOptions: Highcharts.Options = {
      chart: {
        type: 'heatmap',
        backgroundColor: 'rgba(255,255,255,0)',
        margin: [0, 0, 0, 0],

        height: undefined
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },

      xAxis: {
        categories: xCategories,
        tickLength: 0,
        lineWidth: 0,
        gridLineWidth: 0,
        labels: {
          enabled: false
        }
      },

      yAxis: {
        categories: yCategories,
        title: { text: undefined },
        reversed: true,
        tickLength: 0,
        lineWidth: 0,
        gridLineWidth: 0,
        labels: {
          enabled: false
        }
      },

      colorAxis: {
        min: 0,
        max: allZero ? 1 : undefined,
        stops: [
          [0, 'rgba(56, 189, 248, 0.1)'], // transparent for 0 (or very low)
          [0.1, 'rgba(56, 189, 248, 0.2)'],
          [0.4, 'rgba(56, 189, 248, 0.6)'],
          [0.8, 'rgba(56, 189, 248, 0.8)'],
          [1, 'var(--color-brand)']
        ]
      },

      plotOptions: {
        heatmap: {
          // These determine the tile size in axis units (1 category step)
          // Keep them as 1 when using categories.
          colsize: 1,
          rowsize: 1,
          // Creates visible gaps between squares
          pointPadding: 2, // 0..0.5 (bigger => more gap)

          // Round corners optional
          // borderRadius: 2,
          borderWidth: 0 // let padding create the gap
        }
      },

      series: [
        {
          type: 'heatmap',
          data: series,
          dataLabels: { enabled: false },
          // Helps keep squares looking crisp
          turboThreshold: 0
        } satisfies Highcharts.SeriesHeatmapOptions
      ]
    };

    Highcharts.chart(containerId, chartOptions);
  } catch (err) {
    console.warn(`Chart error for ${pkgName}:`, err);
  }
};
