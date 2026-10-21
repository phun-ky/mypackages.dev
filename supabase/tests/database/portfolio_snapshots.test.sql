-- Who can read and write the front page's example portfolio (#67). Run with
-- `supabase test db` against a local database.
begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

-- As the function, with the service role -----------------------------------

set local role service_role;

select lives_ok(
  $$ insert into public.portfolio_snapshots
       (username, role, package_count, monthly_downloads, change_pct, months, top_packages)
     values ('someone', 'maintainer', 2, 100, 5.5,
       '[{"month": "2026-09", "downloads": 100}]',
       '[{"name": "a", "monthly": 90, "change_pct": null}]') $$,
  'the service role can write snapshots'
);

select throws_ok(
  $$ insert into public.portfolio_snapshots
       (username, role, package_count, monthly_downloads, months, top_packages)
     values ('bad', 'maintainer', -1, 0, '[]', '[]') $$,
  '23514',
  null,
  'package counts are never negative'
);

select throws_ok(
  $$ insert into public.portfolio_snapshots
       (username, role, package_count, monthly_downloads, months, top_packages)
     values ('bad', 'maintainer', 0, 0, '{}', '[]') $$,
  '23514',
  null,
  'months is a list'
);

-- As a visitor, with the public anon key -----------------------------------

reset role;
set local role anon;

select results_eq(
  $$ select username, monthly_downloads from public.portfolio_snapshots $$,
  $$ values ('someone'::text, 100::bigint) $$,
  'anon can read snapshots'
);

select throws_ok(
  $$ insert into public.portfolio_snapshots
       (username, role, package_count, monthly_downloads, months, top_packages)
     values ('me', 'maintainer', 1, 1, '[]', '[]') $$,
  '42501',
  null,
  'anon cannot write snapshots'
);

select throws_ok(
  $$ update public.portfolio_snapshots set monthly_downloads = 0 $$,
  '42501',
  null,
  'anon cannot change snapshots'
);

select throws_ok(
  $$ delete from public.portfolio_snapshots $$,
  '42501',
  null,
  'anon cannot delete snapshots'
);

select throws_ok(
  $$ truncate public.portfolio_snapshots $$,
  '42501',
  null,
  'anon cannot empty the table'
);

-- As a signed-in user -------------------------------------------------------

reset role;
set local role authenticated;

select throws_ok(
  $$ update public.portfolio_snapshots set monthly_downloads = 0 $$,
  '42501',
  null,
  'signed-in users cannot change snapshots'
);

-- The schedule ----------------------------------------------------------------

reset role;

select results_eq(
  $$ select schedule from cron.job where jobname = 'portfolio-snapshot' $$,
  $$ values ('17 3-8 * * *'::text) $$,
  'the snapshot is tried every hour from 03:17 to 08:17 UTC'
);

select ok(
  (select command like '%vault.decrypted_secrets%' and command not like '%eyJ%'
   from cron.job where jobname = 'portfolio-snapshot'),
  'the job reads its secret from Vault, not from the migration'
);

-- Runs the job's command, and counts the requests it queued
create function pg_temp.requests_queued_by_job() returns bigint
  language plpgsql as $f$
declare
  before bigint := (select count(*) from net.http_request_queue);
begin
  execute (select command from cron.job where jobname = 'portfolio-snapshot');
  return (select count(*) from net.http_request_queue) - before;
end
$f$;

select vault.create_secret('http://localhost:54321', 'project_url');
select vault.create_secret('test-secret', 'portfolio_snapshot_secret');

-- 'someone' was written above, just now
select is(
  pg_temp.requests_queued_by_job(),
  0::bigint,
  'the job does nothing when today''s snapshot exists'
);

update public.portfolio_snapshots set computed_at = now() - interval '1 day';

select is(
  pg_temp.requests_queued_by_job(),
  1::bigint,
  'the job calls the function when the snapshot is old'
);

select * from finish();

rollback;
