import type { SupabaseClient } from '@supabase/supabase-js';

export const setActiveProviderToken = async (
  supabase: SupabaseClient,
  body: { provider: 'npm' | 'github'; token_id: string },
  signal?: AbortSignal
) => {
  const {
    data: { session },
    error: sErr
  } = await supabase.auth.getSession();

  if (sErr) throw new Error(sErr.message);

  if (!session?.access_token) throw new Error('No session');

  const { data, error } = await supabase.functions.invoke('set-active-token', {
    body,
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY.trim(),
      Authorization: `Bearer ${session.access_token.trim()}`
    },
    signal
  });

  if (error) throw new Error(error.message);

  if (!data?.ok) throw new Error('Failed to set active token');

  return true;
};
