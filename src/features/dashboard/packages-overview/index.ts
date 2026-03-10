import type { ComponentBasePropsType } from '../../../lib/spa/types';
import type { Config, FetchUserPackagesUnionItem } from '../../../types';

import { Keywords } from './components/Keywords';
import { Meta } from './components/Meta';
import { NewestPackages } from './components/NewestPackages';
import { PackagesTable } from './components/PackagesTable';
import { PopularPackages } from './components/PopularPackages';
import { TrendingPackages } from './components/TrendingPackages';
import './styles/packagesOverview.css';

const html = String.raw;

export type PackagesOverviewPropsType = ComponentBasePropsType & {
  username: string;
  options: Config;
  packages: FetchUserPackagesUnionItem[];
};

export const PackagesOverview = async (
  props: PackagesOverviewPropsType,
  signal: AbortSignal
) => {
  const { username, options, packages } = props;

  return html`<div class="packages-overview">
    ${await PopularPackages({ packages, options }, signal)}
    ${await NewestPackages({ packages, options }, signal)}
    ${await TrendingPackages({ packages, options }, signal)}
    ${await Meta({ username, packages, options }, signal)}
    ${await PackagesTable({ packages }, signal)} ${Keywords({ packages })}
  </div>`;
};
