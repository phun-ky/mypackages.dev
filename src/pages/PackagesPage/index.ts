import { DiscoverPage } from '../../features/discover/discover-page';
import type { PagePropsType } from '../../lib/spa/types';

export type PackagesPagePropsType = PagePropsType;

export const PackagesPage = (
  props: PackagesPagePropsType,
  signal: AbortSignal
) => DiscoverPage('package', props, signal);
