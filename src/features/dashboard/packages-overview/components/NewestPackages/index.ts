import { Package } from '../../../../../components/content/Package';
import type { ComponentBasePropsType } from '../../../../../lib/spa/types';
import type { Config, FetchUserPackagesUnionItem } from '../../../../../types';

import './styles/newestPackages.css';

const html = String.raw;

export type NewestPackagesPropsType = ComponentBasePropsType & {
  packages: FetchUserPackagesUnionItem[];
  options: Config;
};

export const NewestPackages = async (
  props: NewestPackagesPropsType,
  signal: AbortSignal
) => {
  const { packages, options } = props;

  console.log(packages);

  const newestPackages = [...packages].sort((a, b) => {
    const aa = new Date(a.package.date ?? a.package.updated ?? 0).getTime();
    const bb = new Date(b.package.date ?? b.package.updated ?? 0).getTime();

    return bb - aa; // newest first
  });
  const items = await Promise.all(
    newestPackages
      .slice(0, 4)
      .map((pkg, index) =>
        Package({ type: 'newest', pkg, index, options }, signal)
      )
  );

  return html`<div class="newest-packages">
    <span class="title h3">Newest packages</span>
    ${items.join('\n')}
  </div>`;
};
