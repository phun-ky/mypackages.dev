-- Least-privilege grants for the public roles (#54) -------------------------

-- Supabase's defaults gave anon and signed-in users ALL on every table and
-- sequence, including TRUNCATE, which row level security doesn't apply to.
-- PostgREST can't send a TRUNCATE, but nothing else would stand between the
-- public anon key and emptying a table if another path appeared. Leave each
-- role only what the table's policies are for.

revoke truncate, trigger, references, maintain
  on all tables in schema public
  from anon, authenticated;

-- The identity columns don't need sequence privileges to insert
revoke all on all sequences in schema public from anon, authenticated;

-- Tracked packages: read and removed by the site, added by ensure_package
-- with the user's token. There is no update policy.
revoke all on table public.ensured_packages from anon, authenticated;
grant select, insert, delete on table public.ensured_packages to authenticated;

-- Settings: read and saved (upserted) by the profile page
revoke all on table public.user_settings from anon, authenticated;
grant select, insert, update, delete on table public.user_settings to authenticated;

-- Stored tokens and their selections: only the service role and the token
-- functions use them
revoke all on table public.user_provider_tokens from anon, authenticated;
revoke all on table public.user_provider_token_selections from anon, authenticated;

-- New tables and sequences start closed ---------------------------------------

-- Each new table gets explicit grants in its migration, as
-- portfolio_snapshots does
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
