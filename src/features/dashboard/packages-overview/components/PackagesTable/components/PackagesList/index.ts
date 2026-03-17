import { getLastYearDownloadsResult } from '../../../../../../../services/npm/get-last-year-downloads-result';
import type { FetchUserPackagesUnionItem } from '../../../../../../../types';
import { assertNever } from '../../../../../../../utils/error/assert-never';
import { getDataForChart } from '../../../../../../package/get-data-for-chart';
import { Link } from '/components/actions/Link';

const html = String.raw;

export const PackagesList = async (
  pkg: FetchUserPackagesUnionItem,
  signal?: AbortSignal
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, links } = pkg.package;
  const numberFormat = new Intl.NumberFormat(navigator.language);
  const monthlyDownloads = numberFormat.format(pkg.downloads.monthly);

  let percentageChangeStateClass = 'flat';
  let formattedMoM = 'N/A';

  const res = await getLastYearDownloadsResult(name, signal);

  if (!res.ok) {
    switch (res.kind) {
      case 'http': {
        const { status, url, retryAfterSeconds } = res;

        if (status >= 500) {
          console.warn('Downloads API server error', status, url);
        } else if (status === 429) {
          console.info?.(
            'Downloads API rate limited',
            status,
            url,
            retryAfterSeconds
          );
        } else if (status === 404) {
          console.warn('File not found', status, url);
        } else {
          console.warn('AWDASDASD', res.body);
        }

        break;
      }
      case 'abort': {
        // totally normal; do nothing
        break;
      }
      case 'network': {
        console.warn(
          'Downloads API network/CORS failure',
          res.url,
          res.message
        );

        break;
      }
      default: {
        assertNever(res);
      }
    }
  } else {
    const { data } = res;
    const { /*weekly,*/ monthly } = getDataForChart(data.downloads);
    const { intervalRecord, intervals } = monthly;
    // Latest complete month and the one before it
    const lastMonth = intervals.at(-1);
    const prevMonth = intervals.at(-2);
    const lastMonthDownloads = lastMonth
      ? intervalRecord[lastMonth]
      : undefined;
    const prevMonthDownloads = prevMonth
      ? intervalRecord[prevMonth]
      : undefined;

    let monthOverMonthChangePct: number | null = null;

    if (
      typeof lastMonthDownloads === 'number' &&
      typeof prevMonthDownloads === 'number'
    ) {
      if (prevMonthDownloads === 0) {
        monthOverMonthChangePct = lastMonthDownloads === 0 ? 0 : Infinity;
      } else {
        monthOverMonthChangePct =
          ((lastMonthDownloads - prevMonthDownloads) / prevMonthDownloads) *
          100;
      }
    }

    percentageChangeStateClass =
      monthOverMonthChangePct == null || Number.isNaN(monthOverMonthChangePct)
        ? 'flat'
        : monthOverMonthChangePct >= 0
          ? 'positive'
          : 'negative';

    formattedMoM =
      monthOverMonthChangePct === null
        ? 'N/A'
        : monthOverMonthChangePct === Infinity
          ? '∞%'
          : `${monthOverMonthChangePct.toFixed(1)}%`;
  }

  return html`<tr>
    <td class="string package-name">
      ${Link({ to: `/packages/${name}`, children: html`<span>${name}</span>` })}
    </td>
    <td>
      <span class="percentage-change ${percentageChangeStateClass}">
        <span class="icon negative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 -960 960 960"
          >
            <path
              d="M640-240v-80h104L536-526 376-366 80-664l56-56 240 240 160-160 264 264v-104h80v240z"
            />
          </svg>
        </span>
        <span class="icon positive">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 -960 960 960"
          >
            <path
              d="m136-240-56-56 296-298 160 160 208-206H640v-80h240v240h-80v-104L536-320 376-480z"
            />
          </svg>
        </span>
        <span class="icon flat">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 -960 960 960"
          >
            <path d="m700-300-57-56 84-84H120v-80h607l-83-84 57-56 179 180z" />
          </svg>
        </span>
        ${formattedMoM}
      </span>
    </td>
    <td class="number downloads">${monthlyDownloads}</td>
  </tr>`;
};
