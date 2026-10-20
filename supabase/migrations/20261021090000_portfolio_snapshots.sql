-- The example portfolio on the front page (#60), computed once a day by the
-- portfolio-snapshot function, so visitors read one row instead of making
-- about 73 npm requests each (#67).

create table public.portfolio_snapshots (
  username text primary key,
  role text not null check (role in ('maintainer', 'author')),
  computed_at timestamptz not null default now(),
  package_count integer not null check (package_count >= 0),
  -- Rolling 30 days per package, summed, as the user page shows it
  monthly_downloads bigint not null check (monthly_downloads >= 0),
  -- From the month before to the latest complete month; null if unknown
  change_pct double precision,
  -- [{ "month": "2025-11", "downloads": 1234 }, ...], oldest first
  months jsonb not null check (jsonb_typeof(months) = 'array'),
  -- [{ "name": "...", "monthly": 1234, "change_pct": 1.5 }, ...]
  top_packages jsonb not null check (jsonb_typeof(top_packages) = 'array')
);

-- Public to read, written only by the function with the service role
alter table public.portfolio_snapshots enable row level security;

revoke all on table public.portfolio_snapshots from public, anon, authenticated;
grant select on table public.portfolio_snapshots to anon, authenticated;

create policy "public read of portfolio snapshots"
  on public.portfolio_snapshots
  for select
  to anon, authenticated
  using (true);

-- Once a day ----------------------------------------------------------------

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- 03:17 UTC, after npm's daily download numbers are in. The project URL and
-- the shared secret come from Vault, so they're never in the repository:
--
--   select vault.create_secret('https://<project>.supabase.co', 'project_url');
--   select vault.create_secret('<secret>', 'portfolio_snapshot_secret');
--
-- The same secret is the function's PORTFOLIO_SNAPSHOT_SECRET. Without the
-- Vault secrets the job fails, and nothing else happens.
select cron.schedule(
  'portfolio-snapshot',
  '17 3 * * *',
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
  );
  $$
);
