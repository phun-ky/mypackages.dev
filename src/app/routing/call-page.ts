import type { PagePropsType } from '/lib/spa/types';

import type { PageType } from './page-loaders';

export const callPage = (
  page: PageType,
  args: { props: PagePropsType; signal: AbortSignal }
) => page(args);
