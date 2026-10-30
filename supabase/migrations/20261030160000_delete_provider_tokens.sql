-- Deleting stored tokens (#125) ------------------------------------------------

-- A stored token is a row in user_provider_tokens pointing at a secret in
-- Vault. Nothing deleted the secret with the row, so deleting a token, or an
-- account (the rows cascade), left the token in Vault; and a token saved again
-- under the same label pointed the row at a new secret and left the old one.
-- Delete the old secret whenever a row goes or its secret changes.
create or replace function public.delete_vault_secret_of_token()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if tg_op = 'DELETE' or new.vault_secret_id is distinct from old.vault_secret_id then
    delete from vault.secrets where id = old.vault_secret_id;
  end if;

  return null;
end;
$$;

revoke execute on function public.delete_vault_secret_of_token()
  from public, anon, authenticated;

create trigger user_provider_tokens_delete_vault_secret
  after delete or update of vault_secret_id on public.user_provider_tokens
  for each row execute function public.delete_vault_secret_of_token();

-- Signed-in users delete their own tokens, through the delete-secret edge
-- function. The active selection goes with the row (on delete cascade).
create or replace function public.delete_provider_token(p_token_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  delete from public.user_provider_tokens
  where id = p_token_id and user_id = auth.uid();

  if not found then
    raise exception 'token not found for user';
  end if;
end;
$$;

revoke execute on function public.delete_provider_token(uuid) from public, anon;
grant execute on function public.delete_provider_token(uuid) to authenticated;

-- Secrets left behind before this: only the tokens save-secret stored, which
-- are named pat:<provider>:<user>:<label>, so the secrets the cron jobs read
-- (project_url, portfolio_snapshot_secret) stay
delete from vault.secrets s
where s.name like 'pat:%'
  and not exists (
    select 1 from public.user_provider_tokens t where t.vault_secret_id = s.id
  );
