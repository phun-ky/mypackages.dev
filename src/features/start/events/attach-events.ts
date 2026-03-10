import type { SupabaseClient } from '@supabase/supabase-js';

import { addOnClick, addOnKeydown, addOnKeyup } from '../../../lib/spa';
import { handleQueryTermToUseEscape } from '../handlers/handle-query-term-to-use-escape';
import { handleQueryTermToUseKeydown } from '../handlers/handle-query-term-to-use-keydown';
import { handleShowMeClick } from '../handlers/handle-show-me-click';
import { handleStartDashboardClick } from '../handlers/handle-start-dashboard-click';

export const attachEvents = (
  supabase: SupabaseClient,
  signal?: AbortSignal
) => {
  addOnKeyup('query-term-to-use', handleQueryTermToUseEscape);
  addOnKeydown(
    'query-term-to-use',
    handleQueryTermToUseKeydown({ supabase, signal })
  );
  addOnClick('show-me', handleShowMeClick({ supabase, signal }));
  addOnClick('start-dashboard', handleStartDashboardClick);
};
