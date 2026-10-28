import { DiscoverPage } from '../../features/discover/discover-page';
import type { PagePropsType } from '../../lib/spa/types';

export const UsersPage = (props: PagePropsType, signal: AbortSignal) =>
  DiscoverPage('user', props, signal);
