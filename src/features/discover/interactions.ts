import type { SupabaseClient } from '@supabase/supabase-js';

import { addOnClick, addOnKeydown } from '../../lib/spa';
import { resolvePathAndNavigate } from '../start/search/resolve-path-and-navigate';

import type { LookupKind } from './lookups';
import { notFoundText } from './sections';

/**
 * Wires the search on a discovery page, for one render. It only looks for
 * its own kind, and says so on the page when nothing is found.
 */
export const attachDiscoverEvents = (
  kind: LookupKind,
  supabase: SupabaseClient,
  signal?: AbortSignal
) => {
  const search = async () => {
    const input = document.getElementById('discover-query');
    const status = document.getElementById('discover-status');

    if (!(input instanceof HTMLInputElement)) return;

    const term = input.value.trim();

    if (!term) return;

    if (status) status.textContent = 'Looking…';

    const found = await resolvePathAndNavigate(
      term,
      { supabase, signal },
      kind
    );

    if (status) status.textContent = found ? '' : notFoundText(kind, term);
  };

  addOnClick('discover-submit', search);
  addOnKeydown('discover-query', (event) => {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    search();
  });
};
