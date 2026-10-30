# Security Policy

mypackages.dev is a website: a static single-page app on GitHub Pages, with
Supabase for sign-in, a Postgres database and edge functions. It shows npm
packages and the people who publish them, and lets signed-in users store an npm
token so the site can call npm on their behalf.

## Supported Versions

Only the site as deployed at <https://mypackages.dev> is supported. Every merge
to `main` deploys, so a fix reaches everyone with the next deploy; there are no
versions to upgrade between.

In scope:

- the site and its source in this repository
- the Supabase edge functions in `supabase/functions`
- the database schema, policies and grants in `supabase/migrations`
- the GitHub Actions workflows that build and deploy them

Out of scope: npm, GitHub and Supabase themselves (report those to them), and
findings that need a compromised device or browser.

## Reporting a Vulnerability

Report vulnerabilities privately, either with GitHub's
[private vulnerability reporting](https://github.com/phun-ky/mypackages.dev/security/advisories/new)
or by email to <security@phun-ky.net>. Please don't open a public issue for a
security problem.

## How Reports Are Handled

1. **Acknowledgement:** you'll get a reply within 7 days confirming the report
   was received.
2. **Assessment:** the maintainer reproduces the issue and judges its severity,
   and may ask you for details.
3. **Fix:** a fix is developed in a private GitHub security advisory and
   deployed. The aim is a fix within 30 days for serious issues.
4. **Disclosure:** the advisory is published once the fix is deployed. Please
   keep the issue private until then.
5. **Credit:** reporters are credited in the advisory, unless they ask to stay
   anonymous.

## Security Expectations

What you can rely on:

- **Stored npm tokens stay on the server.** A token is saved in Supabase Vault
  by the `save-secret` function. Only the service role, used inside the edge
  functions, can read it; signed-in users can't read their own token back, and
  the site only ever gets its provider, label and dates. The functions use it to
  call npm for that user's own requests.
- **Your data is yours.** Settings and tracked packages are protected by row
  level security: a signed-in user reads and changes only their own rows.
  Visitors without an account can't read either.
- **The public key opens only what's public.** The Supabase anon key ships in
  the site by design. With it, a visitor can read the public lookup lists and
  the example portfolio, and log a search through a function that validates it.
  Visitors and signed-in users have no `TRUNCATE`, `TRIGGER` or `REFERENCES` on
  any table, and new tables start with no grants.
- **Searches are logged with little attached, for 90 days.** A search from a
  search box logs the term, whether it was a package or a user, a random id kept
  in your browser, and your account id if you're signed in. Only what was looked
  up and when are public, in the lists of trending, popular and latest lookups.
  Emails and other terms that can't be npm usernames are never logged as users.
  A daily job deletes lookups older than 90 days; see [privacy](PRIVACY.md).
- **The edge functions answer the site only.** They allow only
  `https://mypackages.dev` in CORS, refuse callers without the site's key,
  validate what they're sent, and answer database errors with a generic message.

What you can't rely on yet:

- **A complete Content Security Policy.** GitHub Pages can't send headers, so
  the policy is a `<meta>` tag, which can't set `frame-ancestors` (the site can
  be framed) or reporting. It allows scripts only from the site, but inline
  `style` attributes are allowed, because the templates and Highcharts set them.
- **Availability.** The site depends on npm's public API and its rate limits.
  There is no rate limit of its own on the edge functions.

## Dependencies

**Choosing them.** The fewer, the better. A new dependency must be widely used,
actively maintained and under a licence the dependency review allows.

**Obtaining them.** Packages come only from the npm registry, with exact
versions locked in `package-lock.json` and installed with `npm ci` in CI. GitHub
Actions are pinned to commit SHAs. The edge functions import their few
dependencies by URL, as the Supabase runtime expects.

**Tracking them.** Dependabot proposes version updates weekly and security
updates as soon as an advisory is published. Every pull request runs
[dependency review](.github/workflows/dependency-review.yml), which fails on a
high or critical vulnerability and on a licence outside its allow list.

**Fixing known vulnerabilities.** Findings are checked against the GitHub
Advisory Database:

| Finding                    | Where                  | What happens                                                            |
| -------------------------- | ---------------------- | ----------------------------------------------------------------------- |
| Critical or high           | Runtime dependency     | Blocks merging (dependency review); fixed and deployed within 7 days    |
| Critical or high           | Development dependency | Blocks merging when introduced; an existing one is fixed within 30 days |
| Moderate or low            | Any dependency         | Fixed with the next update, within 90 days                              |
| Licence outside the policy | New dependency         | Not merged without a decision in the pull request that adds it          |

**Accepted exceptions.** None today. A vulnerability that can't be fixed yet and
can't be exploited through this site would be listed here, with why, and allowed
in the dependency review until a fix is reachable.

## Code Scanning

CodeQL analyses every pull request and every push to `main`, for the site's
JavaScript and TypeScript and for the workflows. OpenSSF Scorecard runs on every
push to `main` and weekly; its results are on the
[Scorecard viewer](https://scorecard.dev/viewer/?uri=github.com/phun-ky/mypackages.dev).
Secret scanning with push protection blocks commits that contain a known kind of
secret.

## Secrets

The project keeps as few secrets as possible:

| Secret                      | Kept in                                      | Used by                               | For                                                         |
| --------------------------- | -------------------------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| `VITE_SUPABASE_URL`         | GitHub Actions secret                        | `deploy.yml`                          | The project's address, built into the site (public)         |
| `VITE_SUPABASE_ANON_KEY`    | GitHub Actions secret                        | `deploy.yml`                          | The public anon key, built into the site (public by design) |
| `SUPABASE_ACCESS_TOKEN`     | The `supabase` environment, `main` only      | `supabase.yml`                        | Deploying the edge functions                                |
| `PORTFOLIO_SNAPSHOT_SECRET` | Supabase function secrets and Supabase Vault | `portfolio-snapshot` and its cron job | Letting only the cron job compute the example portfolio     |
| Service role key            | Supabase, given to the functions             | The edge functions                    | Reading stored tokens for the user a function has verified  |

- **Storage:** secrets are kept only in GitHub's and Supabase's secret stores,
  never in the repository.
- **Access:** only the maintainer can view or change them, and GitHub Actions
  secrets are not available to workflows run from forks.
- **Rotation:** at least once a year, and immediately if one may have been
  exposed.
