import { EmphasizedCard } from '../../../../../../../components/content/EmphasizedCard';
import { addOnAfterAppRender } from '../../../../../../../lib/spa';
import { getUserDownloadsByMonth } from '../../../../../../../services/npm/get-user-downloads-by-month';
import type {
  Config,
  FetchUserPackagesUnionItem
} from '../../../../../../../types';
import { renderMonthlyDownloadsChart } from '../../../../../../monthly-downloads-chart';
import './styles/monthlyDownloadsBox.css';

export type MonthlyDownloadsBoxPropsType = {
  username: string;
  packages: FetchUserPackagesUnionItem[];
  options: Config;
};

const html = String.raw;

export const MonthlyDownloadsBox = async (
  props: MonthlyDownloadsBoxPropsType,
  signal: AbortSignal
) => {
  const { packages, options, username } = props;
  const totalDownloads = packages.reduce(
    (sum, pkg) => sum + pkg.downloads.monthly,
    0
  );
  const numberFormat = new Intl.NumberFormat(navigator.language, {
    notation: 'compact',
    compactDisplay: 'short'
  });
  const monthly = await getUserDownloadsByMonth(username, options, signal);
  const months = Object.keys(monthly).sort();
  // Latest complete month and the one before it
  const lastMonth = months.at(-1);
  const prevMonth = months.at(-2);
  const lastMonthDownloads = lastMonth ? monthly[lastMonth] : undefined;
  const prevMonthDownloads = prevMonth ? monthly[prevMonth] : undefined;

  let monthOverMonthChangePct: number | null = null;

  if (
    typeof lastMonthDownloads === 'number' &&
    typeof prevMonthDownloads === 'number'
  ) {
    if (prevMonthDownloads === 0) {
      monthOverMonthChangePct = lastMonthDownloads === 0 ? 0 : Infinity;
    } else {
      monthOverMonthChangePct =
        ((lastMonthDownloads - prevMonthDownloads) / prevMonthDownloads) * 100;
    }
  }

  const percentageChangeStateClass = !monthOverMonthChangePct
    ? 'flat'
    : monthOverMonthChangePct >= 0
      ? 'positive'
      : 'negative';
  const formattedMoM =
    monthOverMonthChangePct === null
      ? 'n/a'
      : monthOverMonthChangePct === Infinity
        ? '∞%'
        : `${monthOverMonthChangePct.toFixed(1)}%`;

  addOnAfterAppRender(async () => {
    await renderMonthlyDownloadsChart(monthly);
  });

  const formattedTotalDownloads = numberFormat.format(totalDownloads);

  return EmphasizedCard({
    title: 'Downloads',
    subTitle: 'Monthly',
    className: 'monthly-downloads-box',
    children: html` <span class="big-number" id="total_downloads">
        ${formattedTotalDownloads}
      </span>
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
      <div class="monthly-downloads-chart" id="chart-container"></div>`
  });
};
