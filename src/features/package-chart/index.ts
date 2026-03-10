import Highcharts from 'highcharts/esm/highcharts.js';

import type { NpmPackageName } from '../../types';

import { rollingMedian } from './utils/rolling-median';

export type RenderSinglePackageChartPropsType = {
  pkgName: NpmPackageName;
  containerId: string;
  series: [number, number][];
};

/**
 * Render download statistics in the DOM.
 */
export const renderSinglePackageChart = async (
  props: RenderSinglePackageChartPropsType
) => {
  const { pkgName, containerId, series = [] } = props;
  const container = document.getElementById(containerId);

  if (!container) return;

  try {
    const smoothData = rollingMedian(series as [number, number][], 3);
    const chartOptions: Highcharts.Options = {
      chart: {
        type: 'areaspline',
        margin: 0,
        backgroundColor: 'rgba(255,255,255,0)'
      },
      tooltip: { enabled: false },
      title: { text: undefined },
      xAxis: {
        gridLineColor: 'rgba(255,255,255,0.05)',
        gridLineWidth: 0,
        margin: 0,
        maxPadding: 0,
        labels: { enabled: false },
        lineWidth: 0,
        type: 'datetime'
      },
      yAxis: {
        title: { text: undefined },
        labels: { enabled: false },
        lineWidth: 0,
        margin: 0,
        gridLineWidth: 0,
        maxPadding: 0,
        gridLineColor: 'rgba(255,255,255,0.05)'
      },
      legend: { enabled: false },
      plotOptions: {
        areaspline: {
          fillOpacity: 1,
          marker: { enabled: false }
        },
        series: {
          marker: {
            states: {
              hover: {
                enabled: false
              }
            }
          }
        }
      },
      series: [
        {
          name: 'Downloads',
          data: series,
          color: 'var(--package-color)',
          marker: { enabled: false },
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, 'var(--package-color-gradient-start)'],
              [1, 'var(--package-color-gradient-stop)']
            ]
          }
        },
        {
          name: 'Median (3mo)',
          type: 'spline',
          data: smoothData,
          color: 'rgba(255,255,255,0.3)',
          // dashStyle: 'ShortDash',
          lineWidth: 1,
          marker: { enabled: false },
          enableMouseTracking: false // optional: keeps tooltip focused on Downloads
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
