import { getAnonId } from '../../../services/supabase/utils/get-anon-id';
import type { HandleQueryTermOptsType } from '../handlers/handle-query-term-to-use-keydown';

import { resolvePathFromQueryTerm } from './resolve-path-from-query-term';

export const resolvePathAndNavigate = async (
  queryTermToUse: string,
  opts: HandleQueryTermOptsType
) => {
  const { supabase, signal } = opts;
  const anonId = getAnonId();
  const { to, res } = await resolvePathFromQueryTerm(queryTermToUse, signal);

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
};
