import type { ComponentBasePropsType } from '../../../../../lib/spa/types';
import type { FetchUserPackagesUnionItem } from '../../../../../types';

import { PackagesList } from './components/PackagesList';
import './styles/packagesTable.css';

const html = String.raw;

export type PackagesTablePropsType = ComponentBasePropsType & {
  packages: FetchUserPackagesUnionItem[];
};

export const PackagesTable = async (
  { packages }: PackagesTablePropsType,
  signal?: AbortSignal
) => {
  const sortedByDownloads = [...packages].sort(
    (a, b) => b.downloads.monthly - a.downloads.monthly
  );

  console.log(sortedByDownloads);

  const items = await Promise.all(
    sortedByDownloads.map((pkg) => PackagesList(pkg, signal))
  );

  return html`<div class="packages-table">
    <span class="title h4">Overview</span>
    <table>
      <thead>
        <tr>
          <th class="string">Name</th>
          <th class="string">Trend</th>
          <th class="number">Downloads</th>
        </tr>
      </thead>
      <tbody>
        ${items.join('\n')}
      </tbody>
    </table>
  </div>`;
};
