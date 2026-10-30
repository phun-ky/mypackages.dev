-- Lookups are kept for 90 days (#51). Run with `supabase test db` against a
-- local database.
begin;

create extension if not exists pgtap with schema extensions;

select plan(2);

select results_eq(
  $$ select schedule from cron.job where jobname = 'search-events-retention' $$,
  $$ values ('47 2 * * *'::text) $$,
  'old lookups are deleted every day at 02:47 UTC'
);

insert into public.search_events (kind, username, term, anon_id, created_at)
values
  ('user', 'old', 'old', 'a', now() - interval '91 days'),
  ('user', 'edge', 'edge', 'b', now() - interval '89 days'),
  ('user', 'new', 'new', 'c', now());

-- Runs the job's command, as pg_cron would
do $$ begin
  execute (select command from cron.job where jobname = 'search-events-retention');
end $$;

select results_eq(
  $$ select username from public.search_events
     where username in ('old', 'edge', 'new') order by username $$,
  $$ values ('edge'::text), ('new'::text) $$,
  'lookups older than 90 days are deleted, newer ones kept'
);

select * from finish();

rollback;
