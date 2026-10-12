-- Limit what the public anon key, and signed-in users, can do directly
-- through the REST API. The edge functions and the site keep working: they
-- write searches through log_search_event, read the lookup views, and use
-- the service role for Vault.

-- Search events: only log_search_event writes them -----------------------

-- The insert policy and grants let anyone insert any row directly, skipping
-- the validation below. log_search_event runs as the table owner, so it
-- doesn't need them.
drop policy if exists "allow insert" on public.search_events;

-- The select policies let anyone read every search with the user_id and
-- anon_id of whoever made it. Replace them with one policy for the searches
-- the views show, and only allow reading the columns the views show.
drop policy if exists "no public select" on public.search_events;
drop policy if exists "public read for popular lookups unique people" on public.search_events;
drop policy if exists "public read of latest search_events" on public.search_events;
drop policy if exists "public read of search_events for latest lookups" on public.search_events;

revoke all on table public.search_events from anon, authenticated;
revoke all on sequence public.search_events_id_seq from anon, authenticated;

create policy "public read of package and user searches"
  on public.search_events
  for select
  to anon, authenticated
  using (kind in ('package', 'user'));

grant select (created_at, kind, term, package_name, registry, username)
  on table public.search_events
  to anon, authenticated;

-- The views run as the caller, so they need nothing more, except the count
-- of unique people, which needs user_id and anon_id. A function that runs as
-- its owner counts them and returns only the counts.
create or replace function public.popular_lookup_counts()
returns table (term text, kind public.resolve_kind, unique_people bigint)
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select x.term, x.kind, count(*) as unique_people
  from (
    select distinct
      e.kind,
      e.term,
      coalesce(e.user_id::text, e.anon_id) as person
    from public.search_events e
    where e.kind in ('package', 'user')
      and coalesce(e.user_id::text, e.anon_id) is not null
  ) x
  group by x.term, x.kind
$$;

revoke execute on function public.popular_lookup_counts() from public;
grant execute on function public.popular_lookup_counts() to anon, authenticated;

create or replace view public.popular_lookups_unique_people
  with (security_invoker = on)
as
  select term, kind, unique_people
  from public.popular_lookup_counts()
  order by unique_people desc, term;

-- The views are for reading. latest_lookups is otherwise updatable.
revoke all on table
  public.latest_lookups,
  public.latest_unique_lookups,
  public.popular_lookups_unique_people,
  public.trending_lookups_24h
from anon, authenticated;

grant select on table
  public.latest_lookups,
  public.latest_unique_lookups,
  public.popular_lookups_unique_people,
  public.trending_lookups_24h
to anon, authenticated;

-- Only log valid package names and npm usernames. The site shows these
-- terms on the start page, so markup in them must never get in. The pattern
-- matches the route parameters in src/lib/spa/router/routes.ts: npm names
-- and usernames never contain these characters, and are at most 214 long.
-- search_path is set, as for every SECURITY DEFINER function.
create or replace function public.log_search_event(
  payload jsonb,
  anon_id text default null
) returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  k text := payload->>'kind';
  t text;
begin
  if k is null or k not in ('package', 'user', 'search') then
    raise exception 'Invalid kind';
  end if;

  t := lower(trim(case k
    when 'package' then payload->>'packageName'
    when 'user' then payload->>'username'
    else payload->>'q'
  end));

  if t is null or t = '' or length(t) > 214 then
    raise exception 'Invalid term';
  end if;

  if k = 'package' and t !~ '^(@[^/\s<>"''`&]+/)?[^/\s<>"''`&]+$' then
    raise exception 'Invalid package name';
  end if;

  if k = 'user' and t !~ '^[^/\s<>"''`&]+$' then
    raise exception 'Invalid username';
  end if;

  -- The site sends a random UUID per browser, see get-anon-id.ts
  if anon_id is not null
    and anon_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  then
    raise exception 'Invalid anon_id';
  end if;

  if k = 'package' then
    insert into public.search_events (user_id, kind, package_name, registry, term, anon_id)
    values (auth.uid(), 'package', t, (payload->>'registry')::public.package_registry, t, anon_id);
  elsif k = 'user' then
    insert into public.search_events (user_id, kind, username, term, anon_id)
    values (auth.uid(), 'user', t, t, anon_id);
  else
    -- Free text, but never shown: the views only list packages and users
    insert into public.search_events (user_id, kind, q, term, anon_id)
    values (auth.uid(), 'search', t, t, anon_id);
  end if;
end;
$$;

-- Remove logged terms that the validation above would have refused, like
-- markup, from before it existed
delete from public.search_events
where length(term) > 214
  or (kind = 'package' and term !~ '^(@[^/\s<>"''`&]+/)?[^/\s<>"''`&]+$')
  or (kind = 'user' and term !~ '^[^/\s<>"''`&]+$');

-- Vault and tokens: only for those who need them --------------------------

-- Only save-secret creates secrets, with the service role. Granted to anon,
-- anyone could create secrets, and take the names save-secret uses.
revoke execute on function public.create_vault_secret(text, text, text)
from public, anon, authenticated;

-- These only return anything for a signed-in user (auth.uid()), so anon
-- has no use for them
revoke execute on function public.get_active_provider_token_secret(text) from public, anon;
revoke execute on function public.get_active_provider_token_meta(text) from public, anon;
revoke execute on function public.set_active_provider_token(text, uuid) from public, anon;

-- Trigger function, flagged by the database linter like log_search_event
alter function public.set_updated_at() set search_path = '';
