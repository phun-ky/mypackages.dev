import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    // Sign-in comes back with a one-time code, which only works with the
    // verifier kept in this browser, instead of the tokens themselves
    auth: { flowType: 'pkce' }
  }
);
