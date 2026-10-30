# Privacy

What [My packages](https://mypackages.dev) stores about you, where, for how
long, who can see it, and how to have it deleted. The site shows public data
about npm packages; most of it needs nothing from you.

## Without an account

You can use every public page without signing in.

**Stored on the server:**

- **What you look up.** A search from the search box on the start page, or on
  the Packages and Users pages, logs the term, whether it was a package or a
  user, the time, and a random id your browser keeps. The id isn't linked to
  anything else; it lets the site count unique people per lookup. Emails and
  other terms that can't be npm usernames are never logged as users. Opening a
  package or user page directly isn't logged. Lookups are deleted after **90
  days**.

**Stored in your browser** (localStorage, which you can clear at any time):

- the random id above (`anon_id`)
- responses from npm and the code hosts, kept for up to a day so pages load
  faster, and the packages npm's search has found for each user you open, kept
  for a year
- your theme, and whether the package list shows by scope or as a table

**Seen by other services:** your browser asks GitHub, GitLab, Bitbucket, Azure
DevOps and [OSV](https://osv.dev) directly for a package's stars, issues and
vulnerabilities, so they see your IP address, as with any website. The site is
hosted on GitHub Pages, which keeps its own logs. npm's data is fetched by the
site's edge functions, not by your browser. The fonts are served by the site
itself.

## With an account

Signing in is optional and uses your GitHub account through
[Supabase](https://supabase.com) Auth.

| What                                                            | Where                         | How long                                   |
| --------------------------------------------------------------- | ----------------------------- | ------------------------------------------ |
| Your GitHub user id, username, name, email and avatar address   | Supabase Auth                 | Until your account is deleted              |
| Your npm username and email, and your settings                  | The `user_settings` table     | Until you change them, or the account goes |
| Packages you add to your profile                                | The `ensured_packages` table  | Until you remove them, or the account goes |
| npm or GitHub tokens you store                                  | Supabase Vault, encrypted     | Until deleted; see below                   |
| What you look up, with your account id instead of the random id | The `search_events` table     | 90 days                                    |
| Your session                                                    | Your browser, set by Supabase | Until you sign out or it expires           |

**Profile pictures** are off by default. If you turn on "Show profile pictures"
in your profile, your picture is loaded from GitHub or gravatar.com, and package
maintainers' pictures from GitHub, so those services see which pages you open.

**Stored tokens** are used by the edge functions to call npm for your own
requests. The site itself never gets a token back: only its label, provider and
dates.

## Who can see it

- **You** see your own settings, profile packages and token labels. Row level
  security stops anyone else's account from reading them.
- **Everyone** sees what was looked up and when, as the lists of trending,
  popular and latest lookups, and how many different people looked something up.
  Not who: neither the random id nor your account id is public.
- **The maintainer** can see everything stored in the Supabase project, as its
  administrator. Your stored tokens are encrypted in Vault and only read by the
  edge functions, but an administrator of the project can decrypt them.

Nothing is sold, shared with anyone else, or used for advertising. The site has
no analytics or tracking beyond the lookup log above.

## Deleting your data

- **Settings and profile packages:** change or remove them on your profile page.
- **What's in your browser:** clear the site's data in your browser. "Refresh
  data" on a user page, and "Clear cache" on the dashboard, clear the cached
  responses.
- **Lookups** go after 90 days on their own.
- **A stored token or your whole account:** email <security@phun-ky.net> from
  the address on your GitHub account, and the maintainer deletes it. Deleting an
  account deletes your settings, profile packages and token records, and removes
  your account id from your lookups. The site can't yet delete a token itself,
  and deleting a token record doesn't yet delete its encrypted copy in Vault;
  both are being fixed in
  [#125](https://github.com/phun-ky/mypackages.dev/issues/125), and until then
  the maintainer deletes the Vault copy by hand.

## How it's protected

The [security policy](SECURITY.md#security-expectations) lists what you can rely
on, and the [assurance case](ASSURANCE.md) explains how it's done and tested.

## Changes

Changes to this document are made in pull requests, like any other change, and
deploy with the site. The history of this file is the record of what changed and
when.
