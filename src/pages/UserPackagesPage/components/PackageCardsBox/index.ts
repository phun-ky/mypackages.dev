import { Package } from '../../../../components/content/Package';
import type { ComponentBasePropsType } from '../../../../lib/spa/types';
import type { Config, FetchUserPackagesUnionItem } from '../../../../types';

const html = String.raw;

export type PackageCardsBoxPropsType = ComponentBasePropsType & {
  packages: FetchUserPackagesUnionItem[];
  options: Config;
  signal: AbortSignal;
};

export const PackageCardsBox = async ({
  packages,
  options,
  signal
}: PackageCardsBoxPropsType) => {
  const sortedByDownloads = [...packages].sort(
    (a, b) => b.downloads.monthly - a.downloads.monthly
  );
  const items = await Promise.all(
    sortedByDownloads.map((pkg, index) =>
      Package({ pkg, index, options }, signal)
    )
  );

  return html`<div class="package-cards" id="package-cards">
    ${items.join('\n')}
  </div>`;
};
