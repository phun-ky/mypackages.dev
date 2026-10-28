-- Only npm usernames as user lookups (#86) ---------------------------------

-- npm's search matches a maintainer's email too, so a search for an email
-- found packages, and the email was logged as a user and shown on the start
-- page. npm usernames are lowercase and URL-safe, and never start with a
-- dot (npm-user-validate), so they have no @. The quote is left out, as in
-- the route parameters. The site ignores a logging error, so searching for
-- an email still works; it's just not logged.
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

  if k = 'user' and t !~ '^[a-z0-9_~!*()-][a-z0-9._~!*()-]*$' then
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

-- Remove logged user lookups that the check above refuses
delete from public.search_events
where kind = 'user'
  and term !~ '^[a-z0-9_~!*()-][a-z0-9._~!*()-]*$';
