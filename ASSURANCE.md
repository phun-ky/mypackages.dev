# Assurance Case

This document argues why My packages meets the security expectations in the
[security policy](SECURITY.md#security-expectations), and says where it doesn't
yet. It covers what is protected, the threat model, the trust boundaries, the
controls and how each is tested. It's reviewed whenever a change affects
security, such as a new table, edge function or data source. What the site
stores about people is in the [privacy notice](PRIVACY.md).

## What is being protected

- **Stored tokens:** the npm and GitHub tokens signed-in users store, which
  could publish packages in their name.
- **Users' data:** their settings, profile packages and account, and who looked
  up what.
- **Visitors:** a page must not run code someone else put there, or send a
  visitor's session anywhere.
- **The site's integrity:** what is deployed must be what was reviewed in this
  repository.

## Threat model

| Threat                                                         | Where it would come from                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------- |
| Script injected into a page (XSS)                              | npm data (descriptions, keywords, READMEs), the URL, code hosts |
| A stolen session, used to read or store tokens                 | XSS, or tokens leaked into URLs or logs                         |
| Reading or changing another user's data                        | The public anon key, which ships in the site                    |
| Stored tokens read back                                        | The browser, the REST API, a function's error messages          |
| Edge functions used for other sites or to exhaust npm's limits | Other origins, scripts calling the functions directly           |
| Who looked up what, made public                                | The lookup log                                                  |
| Malicious code or a compromised dependency deployed            | A pull request, the npm registry, GitHub Actions                |

## Trust boundaries

```text
 visitor's browser ──static files──▶ GitHub Pages
        │
        ├──REST, anon key + session──▶ Supabase Postgres  (row level security, grants)
        ├──functions, anon key + session──▶ Supabase edge functions ──service role──▶ Vault, Postgres
        │                                          └──▶ npm (with the user's token, if stored)
        └──fetch──▶ GitHub, GitLab, Bitbucket, Azure DevOps, OSV  (public APIs)

 contributor ──pull request──▶ repository ──GitHub Actions──▶ GitHub Pages, Supabase functions
                (review, checks)
```

1. **Browser to database.** The browser holds only the public anon key and the
   user's session. What it can read and write is decided in Postgres, by grants
   and row level security, not by the site's code.
2. **Browser to edge functions.** The functions check the session themselves,
   and are the only code with the service role key, which reads Vault.
3. **Repository to production.** Only GitHub Actions on `main` deploy the site
   and the functions; migrations are applied by the maintainer.

## Controls

### Injected script

- **Escaping:** every value that doesn't come from this code base goes through
  `escapeHtml` (text) or `escapeAttr` (attributes) before it reaches a template,
  and URLs from npm through `safeUrl`, which allows only `http` and `https`.
- **No markup in routes:** route parameters can't contain `<`, `>`, `"`, `'`,
  `` ` `` or `&`; such URLs get the page not found page.
- **Content Security Policy:** scripts only from the site, no inline scripts and
  no `eval`, `object-src 'none'`, and `connect-src` limited to the APIs the site
  calls.
- **Tested by:** `tests/e2e/xss.e2e.ts` (markup in the URL, in the lookup lists
  and in npm data is shown as text, and unsafe links are left out),
  `tests/e2e/csp.e2e.ts` (the policy is in place and blocks what it should),
  `tests/e2e/origins.e2e.ts` (the browser calls only the allowed origins), and
  unit and property tests of the escaping and the routes (`tests/unit`).

### Sessions

- **PKCE sign-in:** GitHub sign-in uses the PKCE flow, so the redirect back
  carries a one-time code, never tokens.
- **The session stays in the browser**, in localStorage, where only the site's
  own scripts can read it; the CSP and the escaping above are what protect it.
- **Tested by:** `tests/e2e/sign-in.e2e.ts`, which checks that no access or
  refresh token appears in any URL.

### Users' data

- **Row level security** on every table: a signed-in user reads and changes only
  their own settings, profile packages and token records.
- **Least privilege grants:** the anon and signed-in roles get only what the
  policies are for, with no `TRUNCATE`, `TRIGGER` or `REFERENCES`, and new
  tables start with no grants (#54).
- **Tested by:** pgTAP tests in `supabase/tests/database`: `grants.test.sql` (17
  assertions on every table's privileges) and `public_access.test.sql` (25
  assertions on what the anon key and a signed-in user can and can't do). Row
  level security on settings and profile packages is not yet tested separately
  for one user against another. CI also runs `supabase db lint` and the security
  advisors.

### Stored tokens

- **Vault:** tokens are saved by the `save-secret` function into Supabase Vault,
  encrypted, through a `security definer` function. The token tables have no
  grants for the anon or signed-in roles; only the service role, inside the
  functions, reads them.
- **Nothing comes back:** the site only gets a token's provider, label and
  dates. Functions answer database errors with a generic message.
- **Deleting means deleting:** a user deletes their own tokens through the
  `delete-secret` function, and a trigger deletes a token's Vault secret
  whenever its row is deleted, also when the account is, or the row gets a new
  secret (#125).
- **Tested by:** `public_access.test.sql` (neither role can read stored tokens,
  by its own id or another user's, create Vault secrets or call the token
  functions; each user gets only their own token through the service role),
  `delete_provider_tokens.test.sql` (a user deletes only their own token, and
  every way a row goes or changes deletes its Vault secret, but no other), and
  the Deno tests of the token functions.

### The edge functions

- **The site only:** CORS allows only `https://mypackages.dev`, every call needs
  the site's key, and input is validated before use.
- **Logging lookups** goes through one `security definer` function that checks
  what it's given; nobody can write to the log directly, and emails and other
  terms that can't be npm usernames are never logged as users.
- **Tested by:** the Deno tests in `supabase/functions` (CORS, validation,
  errors) and `public_access.test.sql` (direct writes to the log are refused).

### The lookup log

- **Only aggregates are public:** trending, popular and latest lookups, and
  counts of unique people; neither the random browser id nor the account id can
  be read.
- **90 days:** a daily job deletes older lookups.
- **Tested by:** `public_access.test.sql` (the ids can't be read) and
  `search_events_retention.test.sql` (the job's schedule, and that it deletes
  exactly the rows older than 90 days).

### Supply chain and deploys

- **Review and checks:** every change is a pull request, merged only when the
  `check` status passes (lint, types, unit, end-to-end, function and database
  tests, the build) and every commit is signed off (DCO).
- **Dependencies:** locked in `package-lock.json` and installed with `npm ci`;
  GitHub Actions pinned to commit SHAs; dependency review on every pull request;
  Dependabot; CodeQL; OpenSSF Scorecard. See the
  [security policy](SECURITY.md#dependencies).
- **Deploys:** only from `main`, by GitHub Actions; the token that deploys the
  functions is in an environment limited to `main`.

## Secure design principles

- **Least privilege:** the browser's key opens only what's public, the session
  only the user's own rows, and the service role is only in the functions.
- **Fail safe defaults:** new tables start with no grants, CORS denies unknown
  origins, and the CSP allows only what's listed.
- **Defence in depth:** XSS is countered by escaping, route patterns and the CSP
  together; data access by grants and row level security together.
- **Little data:** the site stores only what the dashboard needs, keeps lookups
  for 90 days, and makes only aggregates public.

## Known gaps

- **Framing:** GitHub Pages can't send headers, and a `<meta>` CSP can't set
  `frame-ancestors`, so the site can be framed by another site.
- **No rate limit of its own** on the edge functions; npm's limits are the only
  limit.
- **Inline styles are allowed** (`style-src-attr 'unsafe-inline'`), because the
  templates and Highcharts set `style` attributes.
- **An administrator can decrypt stored tokens**, as with any Vault the project
  can read.
- **One maintainer:** pull requests are reviewed by their author's own checks,
  not a second person; see [governance](GOVERNANCE.md#continuity).
