import type { ResolveMode } from '../../../services/search/resolve-search-target';
import { getAnonId } from '../../../services/supabase/utils/get-anon-id';
import type { HandleQueryTermOptsType } from '../handlers/handle-query-term-to-use-keydown';

import { resolvePathFromQueryTerm } from './resolve-path-from-query-term';

/**
 * Goes to the package or user page for a search. With a `mode` other than
 * `auto`, a search that finds nothing of that kind stays on the page, and
 * this returns false.
 */
export const resolvePathAndNavigate = async (
  queryTermToUse: string,
  opts: HandleQueryTermOptsType,
  mode: ResolveMode = 'auto'
) => {
  const { supabase, signal } = opts;
  const anonId = getAnonId();
  const { to, res } = await resolvePathFromQueryTerm(
    queryTermToUse,
    signal,
    mode
  );

  if (mode !== 'auto' && res.kind === 'search') return false;

  await supabase.rpc('log_search_event', {
    payload: res,
    anon_id: anonId
  });

  document.body.dispatchEvent(
    new CustomEvent('navigateTo', {
      bubbles: true,
      cancelable: true,
      detail: { to }
    })
  );

  return true;
};
