import type { SupabaseClient } from '@supabase/supabase-js';

export type ListedSecret = {
  id: string;
  provider: 'npm' | 'github';
  label: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export const listProviderTokens = async (supabase: SupabaseClient) => {
  const {
    data: { session },
    error: sErr
  } = await supabase.auth.getSession();

  if (sErr) throw new Error(sErr.message);

  if (!session?.access_token) throw new Error('No session');

  const { data, error } = await supabase.functions.invoke('list-secrets', {
    body: {},
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY.trim(),
      Authorization: `Bearer ${session.access_token.trim()}`
    }
  });

  if (error) throw new Error(error.message);

  if (!data?.ok) throw new Error('Failed to list secrets');

  return data.items as ListedSecret[];
};
