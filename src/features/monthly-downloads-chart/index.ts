import Highcharts from 'highcharts/esm/highcharts.js';

import { themeColor } from '../../utils/theme-color';

let currentChart: Highcharts.Chart | null = null;
let currentResizeObserver: ResizeObserver | null = null;

export const renderMonthlyDownloadsChart = async (
  monthly: Record<string, number>
) => {
  const monthlyDownloadsElement = document.getElementById('chart-container');
  const seriesData = Object.entries(monthly)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([month, value]) => [new Date(`${month}-01`).getTime(), value]);

  if (!monthlyDownloadsElement) {
    // eslint-disable-next-line no-console -- a chart that silently doesn't draw is hard to report
    console.warn('Chart container not found.');

    return;
  }

  // 🧹 Clean up previous chart and observer
  if (currentChart) {
    currentChart.destroy();
    currentChart = null;
  }

  if (currentResizeObserver) {
    currentResizeObserver.disconnect();
    currentResizeObserver = null;
  }

  const chartOptions: Highcharts.Options = {
    chart: {
      type: 'areaspline',
      margin: 0,
      backgroundColor: themeColor('contrast', 0)
    },
    tooltip: { enabled: false },
    title: { text: undefined },
    xAxis: {
      gridLineColor: themeColor('contrast', 0.05),
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
      gridLineColor: themeColor('contrast', 0.05)
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
        data: seriesData,
        color: {
          linearGradient: { x1: 1, y1: 1, x2: 0, y2: 0 },
          stops: [
            [0, themeColor('brand')], // Start color (at 0, the top)
            [1, themeColor('success')] // End color (at 1, the bottom)
          ]
        },
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

  // Create chart
  currentChart = Highcharts.chart(monthlyDownloadsElement, chartOptions);
  // Attach ResizeObserver
  currentResizeObserver = new ResizeObserver(() => {
    const width = monthlyDownloadsElement.offsetWidth;
    const height = monthlyDownloadsElement.offsetHeight;

    if (width && height) {
      currentChart?.setSize(width, height, false);
    }
  });
  currentResizeObserver.observe(monthlyDownloadsElement);
};
