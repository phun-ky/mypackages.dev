import type { ComponentBasePropsType } from '../../../../../lib/spa/types';
import type { Config, FetchUserPackagesUnionItem } from '../../../../../types';
import { Package } from '../../../../../components/content/Package';

import './styles/popularPackages.css';

const html = String.raw;

export type PopularPackagesPropsType = ComponentBasePropsType & {
  packages: FetchUserPackagesUnionItem[];
  options: Config;
};

export const PopularPackages = async (
  props: PopularPackagesPropsType,
  signal: AbortSignal
) => {
  const { packages, options } = props;
  const sortedByDownloads = [...packages].sort(
    (a, b) => b.downloads.monthly - a.downloads.monthly
  );
  const items = await Promise.all(
    sortedByDownloads
      .slice(0, 4)
      .map((pkg, index) =>
        Package({ type: 'popular', pkg, index, options }, signal)
      )
  );

  return html`<div class="popular-packages">
    <span class="title h3">Popular packages</span>
    ${items.join('\n')}
  </div>`;
};
