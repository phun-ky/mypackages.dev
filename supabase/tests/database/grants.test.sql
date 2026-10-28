-- The table privileges of the public anon key and signed-in users (#54).
-- Row level security doesn't apply to TRUNCATE, so only grants stand between
-- these roles and emptying a table. Run with `supabase test db`.
begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

-- No table privilege that a policy can't limit --------------------------------

select is_empty(
  $$ select c.relname, r.rolname, p.privilege
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     cross join (values ('anon'), ('authenticated')) as r (rolname)
     cross join (values ('TRUNCATE'), ('TRIGGER'), ('REFERENCES'), ('MAINTAIN'))
       as p (privilege)
     where n.nspname = 'public'
       and c.relkind in ('r', 'v', 'm', 'p')
       and has_table_privilege(r.rolname, c.oid, p.privilege) $$,
  'anon and signed-in users cannot truncate, add triggers to or reference any table'
);

select is_empty(
  $$ select c.relname, r.rolname
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     cross join (values ('anon'), ('authenticated')) as r (rolname)
     where n.nspname = 'public'
       and c.relkind = 'S'
       and (has_sequence_privilege(r.rolname, c.oid, 'USAGE')
         or has_sequence_privilege(r.rolname, c.oid, 'UPDATE')) $$,
  'anon and signed-in users cannot use or set any sequence'
);

-- Only what each table's policies are for -------------------------------------

select table_privs_are(
  'public', 'ensured_packages', 'anon', array[]::text[],
  'anon has no privileges on tracked packages'
);

select table_privs_are(
  'public', 'ensured_packages', 'authenticated',
  array['SELECT', 'INSERT', 'DELETE'],
  'signed-in users can read, add and remove tracked packages'
);

select table_privs_are(
  'public', 'user_settings', 'anon', array[]::text[],
  'anon has no privileges on settings'
);

select table_privs_are(
  'public', 'user_settings', 'authenticated',
  array['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  'signed-in users can read and save settings'
);

select table_privs_are(
  'public', 'user_provider_tokens', 'anon', array[]::text[],
  'anon has no privileges on stored tokens'
);

select table_privs_are(
  'public', 'user_provider_tokens', 'authenticated', array[]::text[],
  'signed-in users have no privileges on stored tokens'
);

select table_privs_are(
  'public', 'user_provider_token_selections', 'anon', array[]::text[],
  'anon has no privileges on token selections'
);

select table_privs_are(
  'public', 'user_provider_token_selections', 'authenticated', array[]::text[],
  'signed-in users have no privileges on token selections'
);

-- New tables start closed -------------------------------------------------------

create table public.grants_test_new_table (id int);
create sequence public.grants_test_new_sequence;

select table_privs_are(
  'public', 'grants_test_new_table', 'anon', array[]::text[],
  'a new table grants anon nothing'
);

select table_privs_are(
  'public', 'grants_test_new_table', 'authenticated', array[]::text[],
  'a new table grants signed-in users nothing'
);

select ok(
  not has_sequence_privilege('anon', 'public.grants_test_new_sequence', 'USAGE')
  and not has_sequence_privilege('authenticated', 'public.grants_test_new_sequence', 'USAGE'),
  'a new sequence grants anon and signed-in users nothing'
);

-- The site still works for a signed-in user -------------------------------------

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'one@example.com');

set local role authenticated;
set local request.jwt.claims to
  '{"sub": "00000000-0000-4000-8000-000000000001", "role": "authenticated"}';

-- As the profile page saves settings, with an upsert
select lives_ok(
  $$ insert into public.user_settings (user_id, npm_username)
     values ('00000000-0000-4000-8000-000000000001', 'phun-ky')
     on conflict (user_id) do update set npm_username = excluded.npm_username $$,
  'a signed-in user can save their settings'
);

select lives_ok(
  $$ insert into public.user_settings (user_id, npm_username)
     values ('00000000-0000-4000-8000-000000000001', 'phun-ky-2')
     on conflict (user_id) do update set npm_username = excluded.npm_username $$,
  'a signed-in user can change their settings'
);

-- As ensure_package does, with the user's token
select lives_ok(
  $$ insert into public.ensured_packages (user_id, registry, package_name)
     values ('00000000-0000-4000-8000-000000000001', 'npm', '@phun-ky/speccer') $$,
  'a signed-in user can track a package'
);

select results_eq(
  $$ with removed as (
       delete from public.ensured_packages
       where package_name = '@phun-ky/speccer'
       returning package_name
     )
     select package_name from removed $$,
  $$ values ('@phun-ky/speccer'::text) $$,
  'a signed-in user can stop tracking a package'
);

select * from finish();

rollback;
