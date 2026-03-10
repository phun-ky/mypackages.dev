import type { SupabaseClient } from '@supabase/supabase-js';

import { resolvePathAndNavigate } from '../search/resolve-path-and-navigate';

export type HandleQueryTermOptsType = {
  supabase: SupabaseClient;
  signal?: AbortSignal;
};

export const handleQueryTermToUseKeydown =
  (opts: HandleQueryTermOptsType) => async (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return;

    const inputElement = event.target;

    if (!(inputElement instanceof HTMLInputElement)) return;

    event.preventDefault();

    const queryTermToUse = inputElement.value;

    if (!queryTermToUse.trim()) return;

    await resolvePathAndNavigate(queryTermToUse, opts);
    inputElement.value = '';
  };
