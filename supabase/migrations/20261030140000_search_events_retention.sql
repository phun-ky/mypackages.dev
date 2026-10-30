-- Keep lookups for 90 days (#51) -----------------------------------------------

-- search_events holds every lookup with the signed-in user's id or the random
-- id the browser keeps, and was kept forever. The public sees only the
-- aggregated views, so after 90 days the raw rows go: "most looked up" covers
-- the last 90 days, and trending (24 hours) and the latest lookups are
-- unaffected. Deleted daily at 02:47 UTC, before the portfolio snapshot.
select cron.schedule(
  'search-events-retention',
  '47 2 * * *',
  $$ delete from public.search_events where created_at < now() - interval '90 days' $$
);
