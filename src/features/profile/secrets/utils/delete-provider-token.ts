import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Deletes one of the signed-in user's stored tokens, and its copy in Vault,
 * through the delete-secret edge function (#125).
 */
export const deleteProviderToken = async (
  supabase: SupabaseClient,
  body: { token_id: string },
  signal?: AbortSignal
) => {
  const {
    data: { session },
    error: sErr
  } = await supabase.auth.getSession();

  if (sErr) throw new Error(sErr.message);

  if (!session?.access_token) throw new Error('No session');

  const { data, error } = await supabase.functions.invoke('delete-secret', {
    body,
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY.trim(),
      Authorization: `Bearer ${session.access_token.trim()}`
    },
    signal
  });

  if (error) throw new Error(error.message);

  if (!data?.ok) throw new Error('Failed to delete the token');

  return true;
};
