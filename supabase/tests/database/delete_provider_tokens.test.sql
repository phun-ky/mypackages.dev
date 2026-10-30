-- Deleting stored tokens deletes them from Vault too (#125). Run with
-- `supabase test db` against a local database.
begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

-- Two users with two npm tokens each, made as the owner, like save-secret
-- does, and the first token of each active
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'one@example.com'),
  ('00000000-0000-4000-8000-000000000002', 'two@example.com');

insert into public.user_provider_tokens (id, user_id, provider, label, vault_secret_id)
values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000001',
   'npm', 'default', vault.create_secret('one-a', 'pat:npm:one:default')),
  ('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-000000000001',
   'npm', 'ci', vault.create_secret('one-b', 'pat:npm:one:ci')),
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-000000000002',
   'npm', 'default', vault.create_secret('two-a', 'pat:npm:two:default')),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-000000000002',
   'npm', 'ci', vault.create_secret('two-b', 'pat:npm:two:ci'));

insert into public.user_provider_token_selections (user_id, provider, active_token_id)
values
  ('00000000-0000-4000-8000-000000000001', 'npm', '00000000-0000-4000-8000-0000000000a1'),
  ('00000000-0000-4000-8000-000000000002', 'npm', '00000000-0000-4000-8000-0000000000b1');

-- What a cron job reads: never touched
select vault.create_secret('https://example.supabase.co', 'project_url');

create function pg_temp.in_vault(secret_name text) returns boolean
  language sql as $$ select exists (select 1 from vault.secrets where name = secret_name) $$;

-- As a visitor ----------------------------------------------------------------

set local role anon;

select throws_ok(
  $$ select public.delete_provider_token('00000000-0000-4000-8000-0000000000a1') $$,
  '42501',
  null,
  'anon cannot delete tokens'
);

-- As the first user -------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to
  '{"sub": "00000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ select public.delete_provider_token('00000000-0000-4000-8000-0000000000b1') $$,
  'P0001',
  'token not found for user',
  'a user cannot delete another user''s token'
);

select lives_ok(
  $$ select public.delete_provider_token('00000000-0000-4000-8000-0000000000a1') $$,
  'a user deletes their own token'
);

reset role;

select ok(
  not exists (select 1 from public.user_provider_tokens
              where id = '00000000-0000-4000-8000-0000000000a1')
  and not pg_temp.in_vault('pat:npm:one:default'),
  'the token is gone, and from Vault'
);

select ok(
  not exists (select 1 from public.user_provider_token_selections
              where user_id = '00000000-0000-4000-8000-000000000001'),
  'it is no longer the active token'
);

select ok(
  pg_temp.in_vault('pat:npm:two:default') and pg_temp.in_vault('pat:npm:one:ci'),
  'the other tokens stay in Vault'
);

-- Saving a token again under its label points the row at a new secret --------

update public.user_provider_tokens
set vault_secret_id = vault.create_secret('one-b2', 'pat:npm:one:ci:new')
where id = '00000000-0000-4000-8000-0000000000a2';

select ok(
  not pg_temp.in_vault('pat:npm:one:ci') and pg_temp.in_vault('pat:npm:one:ci:new'),
  'the replaced secret is deleted from Vault, the new one kept'
);

-- Deleting an account ----------------------------------------------------------

delete from auth.users where id = '00000000-0000-4000-8000-000000000002';

select ok(
  not pg_temp.in_vault('pat:npm:two:default') and not pg_temp.in_vault('pat:npm:two:ci'),
  'deleting an account deletes its tokens from Vault'
);

select ok(
  pg_temp.in_vault('project_url'),
  'secrets that aren''t tokens stay'
);

select ok(
  not has_function_privilege('authenticated', 'public.delete_vault_secret_of_token()', 'execute'),
  'signed-in users cannot call the trigger function'
);

select * from finish();

rollback;
