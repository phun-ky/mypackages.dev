# TODO — Pages, Routes, and Content (v1 → v2)

## Goals

- Provide a great overview/dashboard/statistics experience for npm packages (and
  later other registries).
- Support anonymous users (browse/search) + logged-in users (portfolio,
  watchlists, comparisons, personalization).
- Keep `/packages/:packageName` as canonical package identity URL (supports
  scoped packages like `@scope/name`).

---

## Routes (proposed)

- `/` — StartPage (public)
- `/packages` — PackagesPage (public) [Explorer/Search results]
- `/packages/:packageName` — PackagePage (public) [Canonical package page]
- `/users` — UsersPage (public) [Explorer/Search results for identities]
- `/users/:username` — UserPage (public) [Profile/Overview]
- `/users/:username/packages` — UserPackagesPage (public) [Full package list for
  identity]
- `/dashboard` — DashboardPage (private) [Logged-in workspace/portfolio]
- `/about` — AboutPage (public)

Notes:

- Keep user content under `/users/*` to avoid collisions with package names.
- Keep package content under `/packages/*` to support scoped names.
- Dashboard is “me” (session-based), not shareable by default.

---

## Page content proposals

### StartPage (`/`)

- Hero / value proposition
- Primary search input:
  - Search term can be package OR user identity
  - Perform search: packages first, then users/identities
- Suggested search examples (chips):
  - `@scope/name`, `vitest`, `phun-ky`
- CTA for login:
  - “Track your portfolio”, “Pin packages”, “Compare intervals”, “Alerts”
- Recent/trending (optional, v2):
  - Popular searches / trending packages

Acceptance criteria (v1):

- Search input routes to:
  - best package match → `/packages/:packageName`
  - else best user match → `/users/:username`
  - else show results page (either `/packages?q=...` or inline list)

---

### PackagesPage (`/packages`)

Purpose: discovery/search for packages across registries (start with npm).

Content (v1):

- Search box + filters:
  - Registry selector (npm now; future: GitHub, Azure, JFrog, Sonatype)
  - Sort: downloads (month), updated, health score
- Results list:
  - Package name + scope
  - Short description
  - Monthly downloads + MoM%
  - Badges: Health (overall), Security, Maintenance, Quality, Popularity
  - “Open” → `/packages/:packageName`

Nice-to-have (v2):

- Facets:
  - License, has types, deprecated, security risk, stale/dormant, keyword
- Saved searches (login)

---

### PackagePage (`/packages/:packageName`)

Purpose: deep view into one package.

Top section (v1):

- Header:
  - Package name, version, license, repo link, registry link
  - Badges: overall health, security, maintenance, quality, popularity
- KPI row:
  - Monthly downloads (last 30d or last complete month)
  - MoM% change
  - Last publish (relative)
  - Latest version / cadence

Main content (v1):

- Downloads chart:
  - Monthly downloads for last 12 months (graph)
  - Meta: avg/month, best month, latest month value
- Health breakdown cards:
  - Security card: risk/ok + summary + counts (if available)
  - Maintenance card: stale/dormant/fresh + score + change
  - Quality card: types/tests/exports/engines/license/repo/readme
  - Popularity card: score + change + label

Secondary content (v1):

- Metadata panel:
  - Maintainers (names)
  - Keywords
  - Links: homepage, repository, bugs
- “Compare” (v2):
  - compare with another package or with portfolio baseline

Logged-in only (v2):

- Pin / watchlist / tags
- Notes per package
- Alerts (e.g. drop > X%, new vuln, deprecated, dormant while high downloads)

---

### UsersPage (`/users`)

Purpose: discovery/search for users/identities.

Content (v1):

- Search input (identity)
- Results list:
  - username
  - total packages (if known)
  - total monthly downloads (aggregate, if computed)
  - “Open profile” → `/users/:username`

Nice-to-have (v2):

- Identity type badges (npm, GitHub, etc)
- Sorting: total downloads, package count, recent activity

---

### UserPage (`/users/:username`)

Purpose: public profile overview (portfolio-lite).

Content (v1):

- Header:
  - @username + links (npm profile, GitHub if available)
- KPI row:
  - Total packages
  - Total monthly downloads (aggregate)
  - MoM% for aggregate (if computable)
  - Health distribution summary (counts by risk/stale/etc)
- Sections:
  - Top packages (by monthly downloads)
  - Recent publishes (by publish date)
  - Biggest movers (up/down) (if history available)
- Link CTA:
  - “View all packages” → `/users/:username/packages`

Logged-in only (v2):

- “Track this user” (watchlist)
- Compare this user vs me / another identity

---

### UserPackagesPage (`/users/:username/packages`)

Purpose: full list of packages for identity.

Content (v1):

- Search within list + filters:
  - Sort: downloads, MoM, health, last publish
  - Filter: security risk, stale/dormant, has types, deprecated
- Table/list rows:
  - name + description
  - monthly downloads + MoM%
  - badges (overall health + sub-badges)
  - last publish
  - open → `/packages/:packageName`

Nice-to-have (v2):

- Bulk actions (logged-in):
  - pin multiple, add to watchlist, tag

---

### DashboardPage (`/dashboard`) — private

Purpose: “my portfolio over time” + actions.

Content (v1, logged in):

- Portfolio KPIs:
  - Total monthly downloads (sum)
  - MoM% (portfolio)
  - Total packages tracked
  - Portfolio health % (overall)
- Portfolio chart:
  - Monthly downloads (sum) last 12 months
- Action panels:
  - Needs attention:
    - security risk packages
    - newly deprecated
    - biggest drops
    - dormant/stale but high downloads
  - Winners:
    - biggest growth
    - best month new peaks
- Packages table (sortable):
  - package, downloads, MoM, health, last publish, quick open

Logged-in only (v2):

- Watchlists/pins/tags
- Notes
- Saved filters/views
- Alerts (email/notifications)
- Cross-registry aggregation & compare intervals (YoY, QoQ)

---

### AboutPage (`/about`)

- What it is / why
- Data sources + limitations (npm rate limits etc)
- Privacy statement (what’s public vs stored when logged in)
- Roadmap (multi-registry support)

---

## Auth rules

Public:

- `/`, `/packages`, `/packages/:packageName`, `/users`, `/users/:username`,
  `/users/:username/packages`, `/about`

Private:

- `/dashboard` (requires session)

Future (private features on public pages):

- Pin / watchlist / tags
- Notes
- Alerts

---

## v1 MVP checklist

- [ ] StartPage search routes to package/user pages
- [ ] PackagesPage explorer/search working (npm)
- [ ] PackagePage:
  - [ ] downloads (monthly + chart)
  - [ ] health breakdown (maintenance/popularity/quality/security)
  - [ ] metadata panel (repo, license, maintainers, keywords)
- [ ] UserPage:
  - [ ] aggregate totals + top packages
- [ ] UserPackagesPage list + sort
- [ ] DashboardPage (logged in):
  - [ ] portfolio totals + chart + table
- [ ] Route privacy guard: redirect or show login required for `/dashboard`

---

## v2 backlog

ages`,`/packages/:packageName`,`/users`,`/users/:username`,`/users/:username/packages`,`/about`

Private:

- `/dashboard` (requires session)

Future (private features on public pages):

- Pin / watchlist / tags
- Notes
- Alerts

---

## v1 MVP checklist

- [ ] StartPage search routes to package/user pages
- [ ] PackagesPage explorer/search working (npm)
- [ ] PackagePage:
  - [ ] downloads (monthly + chart)
  - [ ] health breakdown (maintenance/popularity/quality/security)
  - [ ] metadata panel (repo, license, maintainers, keywords)
- [ ] UserPage:
  - [ ] aggregate totals + top packages
- [ ] UserPackagesPage list + sort
- [ ] DashboardPage (logged in):
  - [ ] portfolio totals + chart + table
- [ ] Route privacy guard: redirect or show login required for `/dashboard`

---

## v2 backlog

- [ ] Watchlists / pin packages
- [ ] Notes + tags
- [ ] Alerts (threshold based)
- [ ] Cross-registry sources (GitHub/Azure/JFrog/Sonatype)
- [ ] Better security scoring + advisory details (backend proxy + caching)
- [ ] Saved searches + shareable searches
- [ ] “Compare packages” view

### ideas

card that accepts a promise, until the promise is fullfilled, show loading
