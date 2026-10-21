-- More chances for the daily portfolio snapshot (#69). npm rate-limits the
-- shared addresses Supabase's functions call from, so a run can fail. Try
-- every hour from 03:17 to 08:17 UTC, and skip once there's a snapshot from
-- the last 20 hours: still one full computation a day.
--
-- Scheduling under the same name replaces the job from
-- 20261021090000_portfolio_snapshots.sql.
select cron.schedule(
  'portfolio-snapshot',
  '17 3-8 * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret from vault.decrypted_secrets
      where name = 'project_url'
    ) || '/functions/v1/portfolio-snapshot',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-snapshot-secret', (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'portfolio_snapshot_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  )
  where not exists (
    select 1 from public.portfolio_snapshots
    where computed_at > now() - interval '20 hours'
  );
  $$
);
