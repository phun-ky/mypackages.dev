-- Stored provider tokens are only for the edge functions --------------------

-- get_active_provider_token_secret() reads the token for auth.uid(), so the
-- functions called it with the user's JWT, and any signed-in browser could
-- call it too: a script injected into the site could read the user's npm
-- token and send it anywhere. The functions now verify the user, then read
-- the token with the service role, for the user id they verified.
create or replace function public.get_provider_token_secret(
  p_user_id uuid,
  p_provider text
) returns text
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select ds.decrypted_secret
  from public.user_provider_token_selections s
  join public.user_provider_tokens t
    on t.id = s.active_token_id
    and t.user_id = s.user_id
  join vault.decrypted_secrets ds on ds.id = t.vault_secret_id
  where s.user_id = p_user_id
    and s.provider = p_provider
  limit 1;
$$;

revoke execute on function public.get_provider_token_secret(uuid, text)
from public, anon, authenticated;
grant execute on function public.get_provider_token_secret(uuid, text)
to service_role;

-- The old function is no longer called by the functions. Kept for now, so
-- functions deployed before this migration still run, but no longer
-- reachable from the browser.
revoke execute on function public.get_active_provider_token_secret(text)
from public, anon, authenticated;
