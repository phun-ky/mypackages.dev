import { SiteHeader } from '../../components/page-section/SiteHeader';
import { attachPackageReportEvents } from '../../features/package-report/interactions';
import {
  monthlyTotals,
  releases,
  releasesInLastYear,
  signalRows,
  verdict,
  weeklyTotals,
  type Signals
} from '../../features/package-report/report';
import {
  keywords,
  linksAndMaintainers,
  needs,
  notice,
  releasesSection,
  reportHead,
  usage,
  verdictCard,
  type ReportData
} from '../../features/package-report/sections';
import type { PagePropsType } from '../../lib/spa/types';
import { fetchRepoStats } from '../../services/git/fetch-repo-stats';
import { isValidRepoUrl } from '../../services/git/is-valid-repo-url';
import { getLastYearDownloadsResult } from '../../services/npm/get-last-year-downloads-result';
import { resolvePackageDetails } from '../../services/npm/packages/resolve-package-details';
import { getLatestVersionFromPackage } from '../../services/npm/packages/utils/get-latest-version-from-package';
import { getPackageByVersion } from '../../services/npm/packages/utils/get-package-by-version';
import { bundleSize } from '../../services/package/bundle-size';
import { getDependenciesMeta } from '../../services/package/dependencies-meta';
import { packageHealth, type Health } from '../../services/package/health';
import { packageMaintenance } from '../../services/package/maintenance';
import { packagePopularity } from '../../services/package/popularity';
import { packageProvenance } from '../../services/package/provenance';
import { packageQuality } from '../../services/package/quality';
import { packageSecurity } from '../../services/package/security';
import type { NpmRepository } from '../../types';
import { safeUrl } from '../../utils/escape-html';
import { normalizeKnownRepoUrl } from '../../utils/normalize';

import './styles/packagePage.css';

const html = String.raw;

/**
 * One package as a report card (#61): the verdict and why, then usage,
 * releases, what it needs, and where to find more.
 */
export const PackagePage = async (
  props: PagePropsType,
  signal: AbortSignal
) => {
  const { packageName, session = null } = props;
  const header = SiteHeader({ session, current: 'packages' });

  if (!packageName) {
    return html`<div class="package-page nebula-page">
      ${header}
      <div class="report"><h1>No package given</h1></div>
    </div>`;
  }

  attachPackageReportEvents();

  const now = Date.now();
  const details = await resolvePackageDetails(packageName, signal);
  const { releaseHealth, time } = details;
  const latestVersion = getLatestVersionFromPackage(details);
  const latestMeta = getPackageByVersion({
    version: latestVersion,
    pkg: details
  });
  const daily = await getLastYearDownloadsResult(packageName, signal);
  const months = daily.ok ? monthlyTotals(daily.data.downloads) : [];
  const weeks = daily.ok ? weeklyTotals(daily.data.downloads) : [];
  const monthRecord = Object.fromEntries(
    months.map((m) => [m.month, m.downloads])
  );
  const lastMonth = months.at(-1)?.downloads ?? details.downloads.monthly;
  const previousMonth = months.at(-2)?.downloads ?? 0;
  const signals: Signals = {};

  let health: Health | null = null;

  // The same signals and weights as before, only computed when the
  // downloads could be fetched, since maintenance and popularity need them
  if (daily.ok) {
    signals.maintenance = packageMaintenance({
      releaseHealth,
      downloadsMonthlyTotal: details.downloads.monthly,
      downloadsMonthlyHistory: monthRecord
    });
    signals.popularity = packagePopularity(lastMonth, previousMonth);
    signals.quality = packageQuality(details);
    signals.provenance = packageProvenance(latestMeta?.dist);
    signals.security = await packageSecurity(
      packageName,
      details['dist-tags']?.latest,
      signal
    );
    health = packageHealth({
      maintenance: signals.maintenance,
      popularity: signals.popularity,
      quality: signals.quality,
      provenance: signals.provenance,
      security: signals.security
    });
  }

  const repoUrl: NpmRepository | string | undefined = normalizeKnownRepoUrl(
    details.repository
  );

  let stars: number | null = null;
  let openIssues: number | null = null;

  if (isValidRepoUrl(repoUrl)) {
    const repo = await fetchRepoStats({ repoUrl, token: undefined, signal });

    stars = repo?.stars ?? repo?.watchers ?? null;
    openIssues = repo?.openIssues ?? null;
  }

  const deps = getDependenciesMeta({ version: latestVersion, pkg: details });
  // A label like "57.5 kB", or "-" when npm doesn't say
  const installSize = bundleSize({ releaseHealth, details });
  const allReleases = releases(time);
  const version = releaseHealth?.latestVersion ?? latestVersion ?? '';
  const bugs = details.bugs;
  const lastPublishMs = releaseHealth?.lastPublishMs ?? null;
  const data: ReportData = {
    name: details.name,
    description:
      typeof details.description === 'string' ? details.description : '',
    version,
    license: releaseHealth?.license ?? null,
    types: releaseHealth?.hasTypes ?? false,
    esm: latestMeta?.type === 'module',
    attested:
      signals.provenance?.reasons.includes('attestations-present') ?? false,
    // The range itself, like ">=22.9.0": `enginesNode` is formatted for display
    enginesNode:
      typeof latestMeta?.engines?.node === 'string'
        ? latestMeta.engines.node
        : null,
    deprecated: releaseHealth?.deprecated
      ? (releaseHealth.deprecatedMessage ?? 'Deprecated')
      : null,
    dependencies: deps.dependencies,
    devDependencies: deps.devDependencies,
    peerDependencies: deps.peerDependencies,
    installSize: installSize.value === '-' ? null : installSize.label,
    fileCount:
      typeof latestMeta?.dist?.fileCount === 'number'
        ? latestMeta.dist.fileCount
        : null,
    maintainers: (details.maintainers ?? [])
      .map((m) => m.name ?? m.username ?? '')
      .filter(Boolean),
    lastPublishMs,
    health,
    rows: signalRows(signals, {
      version,
      lastPublishMs,
      lastMonthDownloads: lastMonth,
      now
    }),
    verdict: verdict(signals, deps.dependencies),
    lastMonth,
    change: signals.maintenance?.changePct ?? null,
    months,
    weeks,
    releases: allReleases,
    releasesLastYear: releasesInLastYear(allReleases, now).map((r) => r.ms),
    links: {
      repository: safeUrl(repoUrl),
      homepage: safeUrl(details.homepage),
      bugs: safeUrl(typeof bugs === 'string' ? bugs : bugs?.url)
    },
    openIssues,
    stars,
    keywords: Array.isArray(details.keywords) ? details.keywords : []
  };

  return html`<div class="package-page nebula-page">
    ${header}
    <div class="report">
      ${reportHead(data, now)} ${notice(Boolean(session))} ${verdictCard(data)}
      ${usage(data)} ${releasesSection(data, now)} ${needs(data)}
      ${linksAndMaintainers(data)} ${keywords(data)}
    </div>
  </div>`;
};
