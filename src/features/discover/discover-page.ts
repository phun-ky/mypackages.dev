import { SiteHeader } from '../../components/page-section/SiteHeader';
import type { PagePropsType } from '../../lib/spa/types';
import { supabase } from '../../services/supabase';

import { getPackageInfo, getUserInfo } from './enrich';
import { attachDiscoverEvents } from './interactions';
import { getLookups, type LookupKind } from './lookups';
import { discoverHead, latest, mostLookedUp, trending } from './sections';

// The user page's card, section and reset rules, and the discovery parts
import '../../pages/UserPage/styles/userPage.css';
import './styles/discover.css';

/**
 * `/packages` or `/users` (#62): a search for that kind, then what other
 * people looked up, with npm's numbers for the most looked up.
 */
export const DiscoverPage = async (
  kind: LookupKind,
  { options, session = null }: PagePropsType,
  signal: AbortSignal
) => {
  attachDiscoverEvents(kind, supabase, signal);

  // The start page sends a search it can't find here
  const query =
    kind === 'package'
      ? (new URLSearchParams(window.location.search).get('q') ?? '')
      : '';
  const lookups = await getLookups(kind);
  const names = lookups.popular.map((row) => row.term);
  const [packages, users] = await Promise.all([
    kind === 'package' ? getPackageInfo(names, signal) : new Map(),
    kind === 'user' ? getUserInfo(names, options, signal) : new Map()
  ]);

  return `<div class="user-page discover-page nebula-page">
  ${SiteHeader({ session, current: kind === 'package' ? 'packages' : 'users' })}
  <div class="user-content">
    ${discoverHead(kind, query)}
    ${trending(kind, lookups.trending)}
    ${mostLookedUp(kind, lookups.popular, packages, users)}
    ${latest(kind, lookups.latest, Date.now())}
  </div>
</div>`;
};
