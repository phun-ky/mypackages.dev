import type { SupabaseClient } from '@supabase/supabase-js';

export type ActiveTokenMeta = null | {
  token_id: string;
  provider: 'npm' | 'github';
  label: string | null;
  meta: Record<string, unknown>;
  updated_at: string;
};

export const getActiveProviderTokenMeta = async (
  supabase: SupabaseClient,
  body: { provider: 'npm' | 'github' },
  signal?: AbortSignal
): Promise<ActiveTokenMeta> => {
  const {
    data: { session },
    error: sErr
  } = await supabase.auth.getSession();

  if (sErr) throw new Error(sErr.message);

  if (!session?.access_token) throw new Error('No session');

  const { data, error } = await supabase.functions.invoke(
    'get-active-token-meta',
    {
      body,
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY.trim(),
        Authorization: `Bearer ${session.access_token.trim()}`
      },
      signal
    }
  );

  if (error) throw new Error(error.message);

  if (!data?.ok) throw new Error('Failed to fetch active token meta');

  return (data.active ?? null) as ActiveTokenMeta;
};
