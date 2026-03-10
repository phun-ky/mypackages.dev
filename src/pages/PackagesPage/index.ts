import type { PagePropsType } from '../../lib/spa/types';

const html = String.raw;

export type PackagesPagePropsType = PagePropsType;

export const PackagesPage = async (
  props: PackagesPagePropsType,
  signal: AbortSignal
) => {
  console.log(props, signal);

  return html`<section class="packages-page"></section>`;
};
