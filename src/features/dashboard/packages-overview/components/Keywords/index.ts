import type { FetchUserPackagesUnionItem } from '../../../../../types';
import './styles/keywords.css';

export type KeywordsPropsType = {
  packages: FetchUserPackagesUnionItem[];
};

const html = String.raw;

export const Keywords = (props: KeywordsPropsType) => {
  const { packages } = props;
  const k = packages.reduce((k: string[], pkg) => {
    return [...new Set([...k, ...(pkg.package.keywords || [])])];
  }, []);

  return html`<div class="keywords">
    <span class="title h3">Keywords</span>
    <div class="badges" id="keywords">
      ${k
        .map(
          (k) =>
            `<a class="badge is-neutral" rel="noopener noreferrer" target="_blank" href="https://www.npmjs.com/search?q=keywords:${k}">${k}</a>`
        )
        .join('\n')}
    </div>
  </div>`;
};
