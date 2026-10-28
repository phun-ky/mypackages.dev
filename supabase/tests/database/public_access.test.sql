-- What the public anon key, and signed-in users, can do directly through the
-- REST API. Run with `supabase test db` against a local database.
begin;

create extension if not exists pgtap with schema extensions;

select plan(25);

-- Two users with a stored npm token each, made as the owner, like
-- save-secret and set-active-token do
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'one@example.com'),
  ('00000000-0000-4000-8000-000000000002', 'two@example.com');

insert into public.user_provider_tokens (id, user_id, provider, label, vault_secret_id)
values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000001',
   'npm', 'default', vault.create_secret('npm_token_one', 'pat:npm:test:one')),
  ('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-000000000002',
   'npm', 'default', vault.create_secret('npm_token_two', 'pat:npm:test:two'));

insert into public.user_provider_token_selections (user_id, provider, active_token_id)
values
  ('00000000-0000-4000-8000-000000000001', 'npm', '00000000-0000-4000-8000-0000000000a1'),
  ('00000000-0000-4000-8000-000000000002', 'npm', '00000000-0000-4000-8000-0000000000a2');

-- As a visitor, with the public anon key -----------------------------------

set local role anon;

select throws_ok(
  $$ insert into public.search_events (kind, term, username)
     values ('user', 'someone', 'someone') $$,
  '42501',
  null,
  'anon cannot insert search events directly'
);

select throws_ok(
  $$ select user_id from public.search_events $$,
  '42501',
  null,
  'anon cannot read who searched'
);

select throws_ok(
  $$ select anon_id from public.search_events $$,
  '42501',
  null,
  'anon cannot read anonymous ids'
);

select lives_ok(
  $$ select public.log_search_event(
       '{"kind": "package", "packageName": "@phun-ky/speccer", "registry": "npm"}',
       '7b1e6f5a-2c3d-4e5f-8a9b-0c1d2e3f4a5b'
     ) $$,
  'anon can log a search for a package'
);

select lives_ok(
  $$ select public.log_search_event(
       '{"kind": "user", "username": "phun-ky"}',
       '7b1e6f5a-2c3d-4e5f-8a9b-0c1d2e3f4a5b'
     ) $$,
  'anon can log a search for a user'
);

select throws_ok(
  $$ select public.log_search_event(
       '{"kind": "user", "username": "<img src=x onerror=alert(1)>"}'
     ) $$,
  'P0001',
  'Invalid username',
  'markup is refused as a username'
);

-- npm's search finds packages for an email too, which must not be shown (#86)
select throws_ok(
  $$ select public.log_search_event(
       '{"kind": "user", "username": "someone@example.com"}'
     ) $$,
  'P0001',
  'Invalid username',
  'an email is refused as a username'
);

select lives_ok(
  $$ select public.log_search_event(
       '{"kind": "user", "username": "some.one_2"}'
     ) $$,
  'usernames with dots and underscores are logged'
);

select throws_ok(
  $$ select public.log_search_event(
       '{"kind": "package", "packageName": "a\"onmouseover=\"alert(1)", "registry": "npm"}'
     ) $$,
  'P0001',
  'Invalid package name',
  'markup is refused as a package name'
);

select throws_ok(
  format(
    $$ select public.log_search_event('{"kind": "package", "packageName": "%s", "registry": "npm"}') $$,
    repeat('a', 215)
  ),
  'P0001',
  'Invalid term',
  'names longer than npm allows are refused'
);

select throws_ok(
  $$ select public.log_search_event(
       '{"kind": "user", "username": "phun-ky"}',
       'not-a-uuid'
     ) $$,
  'P0001',
  'Invalid anon_id',
  'anonymous ids must be UUIDs'
);

select results_eq(
  $$ select term from public.latest_unique_lookups
     where term in ('@phun-ky/speccer', 'phun-ky') order by term $$,
  $$ values ('@phun-ky/speccer'), ('phun-ky') $$,
  'logged searches show in the latest searches'
);

select results_eq(
  $$ select unique_people from public.popular_lookups_unique_people
     where term = '@phun-ky/speccer' $$,
  $$ values (1::bigint) $$,
  'popular searches count unique people'
);

select results_eq(
  $$ select hits from public.trending_lookups_24h
     where term = 'phun-ky' $$,
  $$ values (1::bigint) $$,
  'trending searches count searches'
);

select throws_ok(
  $$ insert into public.latest_lookups (created_at, kind)
     values (now(), 'user') $$,
  '42501',
  null,
  'anon cannot write through the views'
);

select throws_ok(
  $$ select public.create_vault_secret('pat:npm:someone:default', 'secret') $$,
  '42501',
  null,
  'anon cannot create Vault secrets'
);

select throws_ok(
  $$ select public.get_active_provider_token_secret('npm') $$,
  '42501',
  null,
  'anon cannot call the token functions'
);

select throws_ok(
  $$ select public.get_provider_token_secret(
       '00000000-0000-4000-8000-000000000001', 'npm') $$,
  '42501',
  null,
  'anon cannot read stored tokens'
);

-- As a signed-in user -------------------------------------------------------

reset role;
set local role authenticated;

select throws_ok(
  $$ select public.create_vault_secret('pat:npm:someone:default', 'secret') $$,
  '42501',
  null,
  'signed-in users cannot create Vault secrets'
);

select throws_ok(
  $$ select user_id from public.search_events $$,
  '42501',
  null,
  'signed-in users cannot read who searched'
);

-- Only the edge functions need a token, so the browser must never get one,
-- even its own: a script injected into the site could send it anywhere
set local request.jwt.claims to
  '{"sub": "00000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ select public.get_active_provider_token_secret('npm') $$,
  '42501',
  null,
  'signed-in users cannot read their stored token'
);

select throws_ok(
  $$ select public.get_provider_token_secret(
       '00000000-0000-4000-8000-000000000001', 'npm') $$,
  '42501',
  null,
  'signed-in users cannot read stored tokens by user id'
);

-- As the edge functions, with the service role ------------------------------

reset role;
set local role service_role;

select is(
  public.get_provider_token_secret('00000000-0000-4000-8000-000000000001', 'npm'),
  'npm_token_one',
  'the service role gets the active token of the given user'
);

select is(
  public.get_provider_token_secret('00000000-0000-4000-8000-000000000002', 'npm'),
  'npm_token_two',
  'each user gets their own token'
);

select is(
  public.get_provider_token_secret('00000000-0000-4000-8000-000000000001', 'github'),
  null,
  'no token for a provider without one'
);

select * from finish();

rollback;
