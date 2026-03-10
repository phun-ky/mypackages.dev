import { Link } from '../../components/actions/Link';
import { Card } from '../../components/content/Card';
import { EmphasizedCard } from '../../components/content/EmphasizedCard';
import { Maintainers } from '../../components/content/Maintainers';
import { Container } from '../../components/layout/Container';
import { Content } from '../../components/page-section/Content';
import { renderActivityChart } from '../../features/package/activity-chart/render-activity-chart';
import { buildPublishHeatmapSeries } from '../../features/package/build-publish-heatmap-series';
import { renderPackagePageDownloadsChart } from '../../features/package/downloads/chart';
import { getDataForChart } from '../../features/package/get-data-for-chart';
import { getDownloadsDataPerMonth } from '../../features/package/get-downloads-data-per-month';
import { VulnerabilityCard } from '../../features/package/vulnerability-card';
import { releaseStatusFromHealth } from '../../features/release-status';
import { addOnAfterAppRender } from '../../lib/spa';
import type { PagePropsType } from '../../lib/spa/types';
import { fetchRepoStats } from '../../services/git/fetch-repo-stats';
import { isValidRepoUrl } from '../../services/git/is-valid-repo-url';
import { getLastYearDownloadsResult } from '../../services/npm/get-last-year-downloads-result';
import { resolvePackageDetails } from '../../services/npm/packages/resolve-package-details';
import { getLatestVersionFromPackage } from '../../services/npm/packages/utils/get-latest-version-from-package';
import { getPackageByVersion } from '../../services/npm/packages/utils/get-package-by-version';
import { hasDependents } from '../../services/npm/packages/utils/has-dependents';
import { bundleSize } from '../../services/package/bundle-size';
import { getDependenciesMeta } from '../../services/package/dependencies-meta';
import { packageHealth } from '../../services/package/health';
import { packageMaintenance } from '../../services/package/maintenance';
import { packagePopularity } from '../../services/package/popularity';
import { packageProvenance } from '../../services/package/provenance';
import { packageQuality } from '../../services/package/quality';
import { packageSecurity } from '../../services/package/security';
import type { NpmRepository } from '../../types';
import { cx } from '../../utils/cx';
import { formatRelativeTime } from '../../utils/format';
import { normalizeKnownRepoUrl } from '../../utils/normalize';
import { compactNumberFormat, numberFormat } from '../../utils/number-format';
import { slugify } from '../../utils/slugify';

import './styles/packagePage.css';

const html = String.raw;

export const PackagePage = async (
  props: PagePropsType,
  signal: AbortSignal
) => {
  const { packageName, options } = props;
  const { role, username } = options;

  console.log(props);

  if (!packageName || packageName === '') return html`dasd`;

  const details = await resolvePackageDetails(packageName, signal);

  console.log('details', details);

  const {
    releaseHealth,
    name,
    'dist-tags': distTags,
    // versions,
    time,
    keywords,
    bugs
  } = details;
  const packageElementInnerId = `package-page-chart-${slugify(name)}`;
  const activityChartId = `activity-chart-${slugify(name)}`;
  const latestVersion = getLatestVersionFromPackage(details);
  const latestPublishedPackage = getPackageByVersion({
    version: latestVersion,
    pkg: details
  });
  const status = releaseStatusFromHealth(
    releaseHealth,
    details.downloads.monthly
  );

  let percentageChangeClass = 'percentage-change flat';
  let formattedMoM = 'N/A';
  let highestDownloads = 0;
  let avgDownloadsPerMonth = 0;
  let maintenance;
  let quality;
  let popularity;
  let provenance;
  let security;
  let health;
  let stars = 0;
  let openIssues = 0;
  let repoUrl: NpmRepository | string | undefined = undefined;

  repoUrl = normalizeKnownRepoUrl(details.repository);

  const latest = releaseHealth?.latestVersion
    ? `v${releaseHealth.latestVersion}`
    : '-';
  const published = releaseHealth?.lastPublishMs
    ? formatRelativeTime(releaseHealth.lastPublishMs)
    : '-';
  const res = await getLastYearDownloadsResult(packageName, signal);

  if (!res.ok) {
    // something
  } else {
    const { data } = res;
    const { weekly, monthly } = getDataForChart(data.downloads);
    const { intervalRecord: monthRecord, intervals: monthIntervals } = monthly;
    const {
      // intervalRecord: weeklyRecord,
      intervals: weeklyIntervals,
      series: weeklySeries
    } = weekly;
    const downloadsData = getDownloadsDataPerMonth(monthIntervals, monthRecord);

    avgDownloadsPerMonth = downloadsData.average;
    highestDownloads = downloadsData.highest;

    const lastMonth = monthIntervals.at(-1);
    const prevMonth = monthIntervals.at(-2);
    const lastMonthDownloads = lastMonth ? monthRecord[lastMonth] : undefined;
    const prevMonthDownloads = prevMonth ? monthRecord[prevMonth] : undefined;

    maintenance = packageMaintenance({
      releaseHealth,
      downloadsMonthlyTotal: details.downloads.monthly,
      downloadsMonthlyHistory: monthRecord
    });

    const { changePct } = maintenance;

    popularity = packagePopularity(
      lastMonthDownloads ?? 0,
      prevMonthDownloads ?? 0
    );

    quality = packageQuality(details);

    const { latest } = distTags || {};
    const { dist } = latestPublishedPackage || {};

    provenance = packageProvenance(dist);
    security = await packageSecurity(packageName, latest, signal);

    health = packageHealth({
      provenance,
      maintenance,
      popularity,
      quality,
      security
    });

    const hasChange =
      typeof changePct === 'number' && Number.isFinite(changePct);

    formattedMoM = hasChange ? `${changePct.toFixed(1)}%` : 'n/a';

    percentageChangeClass = cx('percentage-change', {
      flat: !hasChange || changePct === 0,
      positive: hasChange && changePct > 0,
      negative: hasChange && changePct < 0
    });

    if (time) {
      const activityHeatMapSeries = buildPublishHeatmapSeries(time);

      if (activityHeatMapSeries.series.length) {
        addOnAfterAppRender(() => {
          renderActivityChart({
            pkgName: name,
            containerId: activityChartId,
            activityHeatMapSeries
          });
        });
      }
    }

    if (weeklyIntervals.length > 0) {
      addOnAfterAppRender(() => {
        renderPackagePageDownloadsChart({
          pkgName: name,
          containerId: packageElementInnerId,
          series: weeklySeries
        });
      });
    }
  }

  if (isValidRepoUrl(repoUrl)) {
    const repoMeta = await fetchRepoStats({
      repoUrl,
      token: undefined,
      signal
    });

    stars = repoMeta?.stars ?? repoMeta?.watchers ?? 0;
    openIssues = repoMeta?.openIssues ?? 0;
  }

  const cadenceDaysLabel =
    typeof maintenance?.meta?.cadenceDays === 'number'
      ? `avg ${maintenance?.meta?.cadenceDays}d`
      : `avg ${maintenance?.meta?.cadenceDays}`;
  const cadenceDaysTitle =
    typeof maintenance?.meta?.cadenceDays === 'number'
      ? `${maintenance?.meta?.cadenceDays}d avg between last ${maintenance?.meta?.cadenceSample} releases`
      : 'Cadence unavailable';
  const highestDownloadsLabel = compactNumberFormat.format(highestDownloads);
  const avgDownloadsLabel = compactNumberFormat.format(avgDownloadsPerMonth);
  const monthlyDownloadsLabel = numberFormat.format(details.downloads.monthly);
  const installSize = bundleSize({ releaseHealth, details });
  const {
    devDependencies,
    peerDependencies,
    dependencies,
    total: totalDependencies
  } = getDependenciesMeta({
    version: latestVersion,
    pkg: details
  });
  const dependents = hasDependents({ role, username, packageName });

  return html`<section class="package-page">
    ${Container({
      children: html`<header class="package-header">
        <h1>
          ${details.name}
          <span class="badges">
            <span class="badge is-stable"> ${latest} </span>
          </span>
        </h1>
        <p class="description">${details.description}</p>
        <div class="package-links">
          ${repoUrl
            ? html`<a
                href="${repoUrl}"
                class="github-link"
                rel="noopener noreferrer"
                target="_blank"
                onClick="(e) => e.stopPropagation()"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96">
                  <path
                    fill="currentColor"
                    fill-rule="evenodd"
                    d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </a>`
            : ''}
          <a
            href="https://www.npmjs.com/package/${packageName}"
            class="npm-link"
            rel="noopener noreferrer"
            target="_blank"
            onClick="(e) => e.stopPropagation()"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
              <path
                fill="currentColor"
                d="M0 16V0h16v16ZM3 3v10h5V5h3v8h2V3Z"
              />
              <path fill="#ffffff00" d="M3 3h10v10h-2V5H8v8H3Z" />
            </svg>
          </a>
          <span class="badges">
            <span class="badge is-${status.key}" title="${status.title}">
              ${status.label}
            </span>
            ${releaseHealth && releaseHealth.license
              ? html`<span class="badge is-neutral" title="License">
                  ${releaseHealth.license}
                </span>`
              : ''}
          </span>
        </div>
      </header>`
    })}
    ${Container({
      children: Content({
        children: html`
          <div class="details">
            <div class="downloads-meta">
              <span class="downloads"> ${monthlyDownloadsLabel} </span>
              <span class="${percentageChangeClass}">
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
                    <path
                      d="m700-300-57-56 84-84H120v-80h607l-83-84 57-56 179 180z"
                    />
                  </svg>
                </span>
                ${formattedMoM}
              </span>
            </div>
            <div class="meta-info">
              <span class="rh-item">
                <strong class="ph">Published</strong> ${published}
              </span>
              <span class="rh-item">
                <strong title="${cadenceDaysTitle}">Cadence</strong>
                ${cadenceDaysLabel}
              </span>
            </div>
          </div>
          ${EmphasizedCard({
            title: 'Package health',
            className: 'package-card-health',
            children: html`<div class="package-card-health-inner">
              <div class="package-card-health-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="currentColor"
                >
                  <path
                    d="M430-350h100v-100h100v-100H530v-100H430v100H330v100h100v100Zm50 249.23q-129.77-35.39-214.88-152.77Q180-370.92 180-516v-230.15l300-112.31 300 112.31V-516q0 145.08-85.12 262.46Q609.77-136.16 480-100.77Zm0-63.23q104-33 172-132t68-220v-189l-240-89.62L240-705v189q0 121 68 220t172 132Zm0-315.62Z"
                  />
                </svg>
              </div>
              <span class="score-of is-${health?.label.toLowerCase()}">
                <span>
                  <span class="score-pct"> ${health?.scorePct} </span>
                  <span class="confidence"> / ${health?.confidencePct} </span>
                </span>
                <span class="label">${health?.label}</span>
              </span>
              <div class="health-sub-container">
                ${Card({
                  children: html` <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="currentColor"
                    >
                      <path
                        d="M480-100.77q-129.77-35.39-214.88-152.77Q180-370.92 180-516v-230.15l300-112.31 300 112.31V-516q0 145.08-85.12 262.46Q609.77-136.16 480-100.77Zm0-63.23q97-30 162-118.5T718-480H480v-314.62L240-705v206.62q0 7.38 2 18.38h238v316Z"
                      />
                    </svg>
                    <span class="label">Security</span>
                    <span
                      class="single-score is-${security?.key}"
                      title="${security?.title}"
                    >
                      ${security?.scorePct}
                    </span>`
                })}
                ${Card({
                  children: html` <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="currentColor"
                    >
                      <path
                        d="M843.92-225.85 738.15-332l41.77-41.77L886.08-268l-42.16 42.15ZM708-698.54l-41.77-41.77L772-846.08l42.15 41.77L708-698.54Zm-456 .39L146.23-804.31 188-846.08l106.15 105.77L252-698.15Zm-136.31 472.3L73.92-268l105.77-105.77L221.85-332 115.69-225.85Zm220.62-39.99L480-352.23l144.08 87.77-37.62-163.62 126.39-109.07-166.39-14.93L480-706.54l-66.08 153.46-166.38 14.54 126.38 110.46-37.61 162.24Zm-91 125.84 61.92-266L100-585.38l273.39-23.47L480-860l107 251.15 273.38 23.47L653.15-406l61.93 266L480-281.31 245.31-140Zm235.07-346Z"
                      />
                    </svg>
                    <span class="label">Quality</span>
                    <span
                      class="single-score is-${quality?.key}"
                      title="${quality?.title}"
                    >
                      ${quality?.scorePct}
                    </span>`
                })}
                ${Card({
                  children: html` <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="currentColor"
                    >
                      <path
                        d="M340-226.15h280v-47.7H340v47.7Zm140-123.08q78.77 0 134.58-55.81 55.8-55.81 55.8-134.96 0-78.77-55.8-134.58-55.81-55.8-134.58-55.8-79.15 0-134.96 55.8-55.81 55.81-55.81 134.58 0 79.15 55.81 134.96T480-349.23Zm0-53.54q-12.23-17.54-22-45.92-9.77-28.39-12.39-67.46H514q-2.61 39.07-12.38 67.46-9.77 28.38-21.62 45.92Zm-58.54-8q-31.69-13.84-53.69-41.46-22-27.62-28.39-63.92h58.54q1.62 26.92 7.16 53.27 5.54 26.34 16.38 52.11Zm114.38 0q11.24-24.61 17.54-51.15 6.31-26.54 8.31-54.23h58.54q-6.77 36.3-29.35 63.92-22.57 27.62-55.04 41.46ZM339.38-563.85q6.77-37.46 29.74-65.46 22.96-28 55.04-40.69-11.62 22.31-17.93 49.04-6.31 26.73-8.31 57.11h-58.54Zm106.23 0q2.62-39.84 12.39-68.42T480-678q11.85 17.15 21.62 45.73 9.77 28.58 12.38 68.42h-68.39Zm116.08 0q-1.61-29.23-7.92-55.96T535.46-670q33.23 12.69 56.19 40.88 22.97 28.2 28.58 65.27h-58.54ZM180-100v-760h527.69q29.92 0 51.12 21.19Q780-817.61 780-787.69v615.38q0 29.92-21.19 51.12Q737.61-100 707.69-100H180Zm60-60h467.69q4.62 0 8.46-3.85 3.85-3.84 3.85-8.46v-615.38q0-4.62-3.85-8.46-3.84-3.85-8.46-3.85H240v640Zm0 0v-640 640Z"
                      />
                    </svg>
                    <span class="label">Provenance</span>
                    <span
                      class="single-score is-${provenance?.key}"
                      title="${provenance?.title}"
                    >
                      ${provenance?.scorePct}
                    </span>`
                })}
                ${Card({
                  children: html` <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="currentColor"
                    >
                      <path
                        d="M240-400q0 60.46 28.89 112.54 28.88 52.08 79.42 84-4.46-8.46-6.39-16.89Q340-228.77 340-238q0-27.77 10.66-52.31 10.65-24.54 30.57-44.46L480-431.92l99.15 97.15q19.93 19.92 30.39 44.46T620-238q0 9.23-1.92 17.65-1.93 8.43-6.39 16.89 50.54-31.92 79.42-84Q720-339.54 720-400q0-50-18.5-94.5T648-574q-20 13-42 19.5t-45 6.5q-62.38 0-107.88-41-45.5-41-52.12-101.77-39 32.62-69 68.12-30 35.5-50.5 72.38-20.5 36.89-31 74.89T240-400Zm240 52-57 56q-11 11-17 25t-6 29q0 32 23.5 55t56.5 23q33 0 56.5-23t23.5-55q0-16-6-29.5T537-292l-57-56Zm-20-456.23V-708q0 42.46 29.27 71.23Q518.54-608 561-608q18.38 0 35.04-6.92 16.65-6.92 30.58-20.39l17.61-17.76q63.23 40.46 99.5 107.96T780-400q0 125.54-87.23 212.77T480-100q-125.54 0-212.77-87.23T180-400q0-115.92 75.54-223.08Q331.08-730.23 460-804.23Z"
                      />
                    </svg>
                    <span class="label">Popularity</span>
                    <span
                      class="single-score is-${popularity?.key}"
                      title="${popularity?.title}"
                    >
                      ${popularity?.scorePct}
                    </span>`
                })}
                ${Card({
                  children: html` <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="currentColor"
                    >
                      <path
                        d="M746.31-101q-7.23 0-13.46-2.31-6.24-2.31-11.85-7.92L519.31-312.54q-5.62-5.62-7.93-11.85-2.3-6.23-2.3-13.46t2.3-13.46q2.31-6.23 7.93-11.84l75.77-75.77q5.61-5.62 11.84-7.93 6.23-2.3 13.46-2.3t13.46 2.3q6.24 2.31 11.85 7.93l201.69 201.69q5.62 5.61 7.93 11.84 2.3 6.24 2.3 13.47t-2.3 13.46q-2.31 6.23-7.93 11.84l-75.77 75.39q-5.61 5.61-11.84 7.92-6.23 2.31-13.46 2.31Zm0-68.46 42.46-42.46L621-379.69l-42.46 42.46 167.77 167.77Zm-533.62 69.07q-7.23 0-13.77-2.61-6.53-2.62-12.15-8.23L111.62-186q-5.62-5.62-8.23-12.15-2.62-6.54-2.62-13.77 0-7.23 2.62-13.66 2.61-6.42 8.23-12.04l208.92-208.92h84.23L437.23-479 269.92-646.31h-57l-111-111 99.16-99.15 111 111v57l167.3 167.31 118.31-118.31-58.38-58.39 50.61-50.61H488.08l-22.23-21.85 127.76-127.77 21.85 21.85V-774l50.61-50.61 150.47 149.69q15.84 15.46 23.88 35.23 8.04 19.77 8.04 41.84 0 19.39-6.69 37.35t-19.46 32.65l-83.46-83.46-56.39 56.39-42.38-42.39-193.54 193.54v84.38L238-111.23q-5.61 5.61-11.85 8.23-6.23 2.61-13.46 2.61Zm0-69.46 183.47-183.46v-42.46h-42.47L170.23-212.31l42.46 42.46Zm0 0-42.46-42.46 21.54 20.93 20.92 21.53Zm533.62.39 42.46-42.46-42.46 42.46Z"
                      />
                    </svg>
                    <span class="label">Maintenance</span>
                    <span
                      class="single-score is-${maintenance?.key}"
                      title="${maintenance?.title}"
                    >
                      ${maintenance?.scorePct}
                    </span>`
                })}
                ${stars > 0
                  ? Card({
                      children: html` <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="currentColor"
                        >
                          <path
                            d="m263-161.54 57.31-246.77-191.46-165.92 252.61-21.92L480-828.84l98.54 232.69 252.61 21.92-191.46 165.92L697-161.54 480-292.46 263-161.54Z"
                          />
                        </svg>
                        <span class="label">Stars</span>
                        <span class="single-score ">
                          ${compactNumberFormat.format(stars)}
                        </span>`
                    })
                  : ''}
                ${openIssues > 0
                  ? Card({
                      to: bugs?.url || undefined,
                      children: html` <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="#f59e0b"
                        >
                          <path
                            d="M74.62-140 480-840l405.38 700H74.62ZM480-247.69q13.73 0 23.02-9.29t9.29-23.02q0-13.73-9.29-23.02T480-312.31q-13.73 0-23.02 9.29T447.69-280q0 13.73 9.29 23.02t23.02 9.29Zm-30-104.62h60v-200h-60v200Z"
                          />
                        </svg>
                        <span class="label">Open issues</span>
                        <span class="single-score "> ${openIssues} </span>`
                    })
                  : ''}
                ${Card({
                  children: html` <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="currentColor"
                    >
                      <path
                        d="m480-256.16 146.15-146.15L584-444.46l-74 74v-178h-60v178l-74-74-42.15 42.15L480-256.16ZM200-643.85v431.54q0 5.39 3.46 8.85t8.85 3.46h535.38q5.39 0 8.85-3.46t3.46-8.85v-431.54H200ZM215.39-140q-29.93 0-52.66-22.73Q140-185.46 140-215.39v-464.38q0-12.84 4.12-24.5 4.11-11.65 12.34-21.5l56.16-67.92q9.84-12.85 24.61-19.58Q252-820 268.46-820h422.31q16.46 0 31.42 6.73T747-793.69L803.54-725q8.23 9.85 12.34 21.69 4.12 11.85 4.12 24.7v463.22q0 29.93-22.73 52.66Q774.54-140 744.61-140H215.39Zm.23-563.84H744l-43.62-51.93q-1.92-1.92-4.42-3.08-2.5-1.15-5.19-1.15H268.85q-2.69 0-5.2 1.15-2.5 1.16-4.42 3.08l-43.61 51.93ZM480-421.92Z"
                      />
                    </svg>
                    <span class="label">Install size</span>
                    <span class="single-score">
                      ${installSize.value}
                      <span class="single-score-suffix">
                        ${installSize.unit}
                      </span>
                    </span>`
                })}
              </div>
            </div>`
          })}
          ${VulnerabilityCard({ packageName, security })}
          ${EmphasizedCard({
            title: 'Dependencies',
            icon: html`<svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 -960 960 960"
            >
              <path
                d="M450-177.23v-285.54L200-607.54v278.62q0 3.07 1.54 5.77 1.54 2.69 4.61 4.61zm60 0 243.85-141.31q3.07-1.92 4.61-4.61 1.54-2.7 1.54-5.77v-278.62L510-462.77zm-66.15 65.46L176.16-265.85q-17.08-9.84-26.62-26.3-9.54-16.47-9.54-36.16v-303.38q0-19.69 9.54-36.16 9.54-16.46 26.62-26.3l267.69-154.08q17.07-9.85 36.15-9.85t36.15 9.85l267.69 154.08q17.08 9.84 26.62 26.3 9.54 16.47 9.54 36.16v303.38q0 19.69-9.54 36.16-9.54 16.46-26.62 26.3L516.15-111.77q-17.07 9.85-36.15 9.85t-36.15-9.85M634.23-604 727-657.23 486.15-796.54q-3.07-1.92-6.15-1.92t-6.15 1.92l-86.85 50zM480-514.46l93-53.85-247-142.77-93 53.85z"
              />
            </svg>`,
            type: 'subtle',
            className: 'dependencies',
            children: html`<div class="dependencies-inner">
              <span class="total">${totalDependencies}</span>
              <dl>
                <dt>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 -960 960 960"
                  >
                    <path
                      d="M212.31-100q-29.92 0-51.12-21.19Q140-142.39 140-172.31v-447.92q-17.61-9.08-28.81-25.81Q100-662.77 100-684.62v-103.07q0-29.92 21.19-51.12Q142.39-860 172.31-860h615.38q29.92 0 51.12 21.19Q860-817.61 860-787.69v103.07q0 21.85-11.19 38.58-11.2 16.73-28.81 25.81v447.92q0 29.92-21.19 51.12Q777.61-100 747.69-100zM200-612.31v438.08q0 6.15 4.42 10.19 4.43 4.04 10.97 4.04h532.3q5.39 0 8.85-3.46t3.46-8.85v-440zm-27.69-60h615.38q5.39 0 8.85-3.46t3.46-8.85v-103.07q0-5.39-3.46-8.85t-8.85-3.46H172.31q-5.39 0-8.85 3.46t-3.46 8.85v103.07q0 5.39 3.46 8.85t8.85 3.46m195.38 249.62h224.62V-480H367.69zM480-386.15"
                    />
                  </svg>
                  <span class="title"> Dependencies </span>
                </dt>
                <dd>${dependencies}</dd>
              </dl>
              <dl>
                <dt>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 -960 960 960"
                  >
                    <path
                      d="M450-177.23v-285.54L200-607.54v278.62q0 3.07 1.54 5.77 1.54 2.69 4.61 4.61zm60 0 243.85-141.31q3.07-1.92 4.61-4.61 1.54-2.7 1.54-5.77v-278.62L510-462.77zm-66.15 65.46L176.16-265.85q-17.08-9.84-26.62-26.3-9.54-16.47-9.54-36.16v-303.38q0-19.69 9.54-36.16 9.54-16.46 26.62-26.3l267.69-154.08q17.07-9.85 36.15-9.85t36.15 9.85l267.69 154.08q17.08 9.84 26.62 26.3 9.54 16.47 9.54 36.16v303.38q0 19.69-9.54 36.16-9.54 16.46-26.62 26.3L516.15-111.77q-17.07 9.85-36.15 9.85t-36.15-9.85M634.23-604 727-657.23 486.15-796.54q-3.07-1.92-6.15-1.92t-6.15 1.92l-86.85 50zM480-514.46l93-53.85-247-142.77-93 53.85z"
                    />
                  </svg>
                  <span class="title"> Dev dependencies </span>
                </dt>
                <dd>${devDependencies}</dd>
              </dl>
              <dl>
                <dt>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 -960 960 960"
                  >
                    <path
                      d="M480-412.31 60.39-636.15 480-860l420 223.85zm0 156.15L83.39-467.38l62.84-34.47L480-324.46l334.15-177.39L877-467.38zM480-100 83.39-311.23l62.84-34.46L480-168.31l334.15-177.38L877-311.23zm0-380.61 294.92-155.54L480-791.69 185.46-636.15zm.38-155.54"
                    />
                  </svg>
                  <span class="title"> Peer dependencies </span>
                </dt>
                <dd>${peerDependencies}</dd>
              </dl>
            </div> `
          })}
          ${EmphasizedCard({
            title: 'Dependents',
            icon: html`<svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 -960 960 960"
            >
              <path
                d="M610-130v-120H450v-400H350v120H90v-300h260v120h260v-120h260v300H610v-120H510v340h100v-120h260v300zM150-770v180zm520 400v180zm0-400v180zm0 180h140v-180H670zm0 400h140v-180H670zM150-590h140v-180H150z"
              />
            </svg>`,
            type: 'subtle',
            className: 'dependents',
            children: html`<div class="dependents-inner">
              <span class="total">${dependents ?? 0}</span>
            </div> `
          })}
          ${EmphasizedCard({
            title: 'Keywords',
            icon: html`<svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 -960 960 960"
            >
              <path
                d="M73.85-213.85v-516.92h73.84v516.92zm110.77 0v-516.92h73.84v516.92zm110.77 0v-516.92h36.92v516.92zm110.76 0v-516.92H480v516.92zm110.77 0v-516.92h110.77v516.92zm147.69 0v-516.92h36.93v516.92zm110.77 0v-516.92h110.77v516.92z"
              />
            </svg>`,
            className: 'keywords',
            children: html`<div class="keywords-inner">
              <div class="badges" id="keywords">
                ${keywords
                  .map(
                    (keyword) =>
                      `<a class="badge is-neutral" rel="noopener noreferrer" target="_blank" href="https://www.npmjs.com/search?q=keywords:${keyword}">${keyword}</a>`
                  )
                  .join('\n')}
              </div>
            </div> `
          })}
          ${EmphasizedCard({
            title: 'Links',
            icon: html`<svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 -960 960 960"
            >
              <path
                d="M323-140q-75.85 0-129.42-53.58Q140-247.15 140-323q0-36.92 13.66-70.23 13.65-33.31 39.73-59.38l127.46-126.47L363-536.92 235.54-409.85q-17.77 17.77-26.85 40.23-9.07 22.47-9.07 46.62 0 51.31 36.03 87.15Q271.69-200 323-200q24.15 0 46.92-9.08 22.77-9.07 40.54-26.84L537.31-363l42.77 42.77-127.47 126.46q-26.07 26.08-59.38 39.92Q359.92-140 323-140m76.31-216.92-42.39-42.77 203.77-203.77 42.77 42.77zm239.84-23.39L597-422.69l127.46-126.85q17.39-17.38 26.16-39.34 8.76-21.97 8.76-46.12 0-51.92-35.73-88.46T636-760q-24.15 0-46.62 9.08-22.46 9.07-39.84 26.46L422.69-597l-42.38-42.15 127.08-127.08q26.07-26.08 59.38-39.92Q600.08-820 637-820q75.85 0 129.11 53.77 53.27 53.77 53.27 130.23 0 36.31-13.34 69.42-13.35 33.12-39.43 59.19z"
              />
            </svg>`,
            type: 'subtle',
            className: 'links',
            children: html`<div class="links-inner">
              <ul>
                ${details.homepage
                  ? `<li>${Link({ to: details.homepage, children: 'Homepage' })}</li>`
                  : ''}
                ${details.bugs
                  ? `<li>${Link({ to: typeof details.bugs === 'string' ? details.bugs : details.bugs.url, children: 'Bugs' })}</li>`
                  : ''}
                ${repoUrl
                  ? `<li>${Link({ to: repoUrl, children: 'Repository' })}</li>`
                  : ''}
                ${packageName
                  ? `<li>${Link({ to: `https://www.npmjs.com/package/${packageName}`, children: 'Npm' })}</li>`
                  : ''}
              </ul>
            </div> `
          })}
          ${EmphasizedCard({
            title: 'Alerts',
            icon: html`<svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 -960 960 960"
            >
              <path
                d="M180-204.62v-59.99h72.31v-298.47q0-80.69 49.81-142.69 49.8-62 127.88-79.31V-810q0-20.83 14.57-35.42Q459.14-860 479.95-860q20.82 0 35.43 14.58Q530-830.83 530-810v24.92q78.08 17.31 127.88 79.31 49.81 62 49.81 142.69v298.47H780v59.99zM479.93-92.31q-29.85 0-51.04-21.24-21.2-21.24-21.2-51.07h144.62q0 29.93-21.26 51.12t-51.12 21.19m-167.62-172.3h335.38v-298.47q0-69.46-49.11-118.57-49.12-49.12-118.58-49.12t-118.58 49.12q-49.11 49.11-49.11 118.57z"
              />
            </svg>`,
            type: 'subtle',
            className: 'alerts',
            children: html`<div class="alerts-inner">
              <p>You haven't set up any alerts yet!</p>
            </div> `
          })}
          ${Maintainers(details.maintainers)}
          ${EmphasizedCard({
            title: 'Downloads per month',
            subTitle: 'Per last year',
            className: 'package-card-downloads',
            children: html`<div
                class="package-card-downloads-chart"
                id="${packageElementInnerId}"
              ></div>
              <div class="downloads-chart-meta">
                <span class="avg-month">
                  <span class="title">Avg/month</span>
                  <span> ${avgDownloadsLabel} </span>
                </span>
                <span class="highest-monthly-downloads">
                  <span class="title">Best month</span>
                  <span> ${highestDownloadsLabel} </span>
                </span>
              </div> `
          })}
          ${EmphasizedCard({
            type: 'box',
            className: 'activity',
            children: html`<div
              class="activity-chart"
              id="${activityChartId}"
            ></div> `
          })}
        `
      })
    })}
  </section>`;
};
