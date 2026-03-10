import type { PagePropsType } from '../../lib/spa/types';

export const PageNotFoundPage = async (
  props: PagePropsType,
  signal: AbortSignal
) => {
  console.log(props, signal);

  return 'Page not found';
};
