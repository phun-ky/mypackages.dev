import type { ComponentBasePropsType } from '../../../../../lib/spa/types';
import type { Config, FetchUserPackagesUnionItem } from '../../../../../types';

import { MonthlyDownloadsBox } from './components/MonthlyDownloadsBox';
import { NumberOfPackages } from './components/NumberOfPackages';

import './styles/meta.css';

const html = String.raw;

export type MetaPropsType = ComponentBasePropsType & {
  username: string;
  packages: FetchUserPackagesUnionItem[];
  options: Config;
};

export const Meta = async (props: MetaPropsType, signal: AbortSignal) => {
  const { packages, options, username } = props;

  return html`<div class="meta">
    ${await MonthlyDownloadsBox({ username, packages, options }, signal)}
    ${NumberOfPackages({ packages })}
  </div>`;
};
