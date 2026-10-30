# Roadmap

What My packages intends to do, and not do, from October 2026 to October 2027.
It's a plan, not a promise: priorities can change, and changes to this file are
made in pull requests like any other. Individual pieces of work are tracked as
[GitHub issues](https://github.com/phun-ky/mypackages.dev/issues), grouped in
[milestones](https://github.com/phun-ky/mypackages.dev/milestones).

## Done in 2026

- **The Nebula, refined design** for every public page, with a light and a dark
  theme ([#47](https://github.com/phun-ky/mypackages.dev/issues/47)).
- **Quality checks:** unit and property tests, end-to-end tests in two browsers,
  accessibility beyond axe, performance budgets, HTML validation, link checks,
  page metadata and link preview images (the
  [Quality checks milestone](https://github.com/phun-ky/mypackages.dev/milestone/2)).
- **Hardening:** a strict Content Security Policy, least-privilege database
  grants, stored npm tokens kept out of the browser, and pinned workflow
  actions.

## Planned

### Telling users what the site stores

- **Privacy and assurance:** what the site stores about users, where, for how
  long and how to delete it, and how it's protected and tested
  ([#51](https://github.com/phun-ky/mypackages.dev/issues/51)).

### Project health

- **OpenSSF Best Practices:** the passing badge, then silver and OSPS Baseline
  levels 1 to 3 ([#52](https://github.com/phun-ky/mypackages.dev/issues/52)).
- **A second maintainer**, so that pull requests get a review from someone other
  than the author and the site doesn't rest on one person; see
  [governance](GOVERNANCE.md#continuity).

## Considered, not scheduled

Ideas that fit the site but have no date. Each would start with an issue.

- **A link preview per package**, with its name, health, downloads and latest
  version ([#77](https://github.com/phun-ky/mypackages.dev/issues/77)). It needs
  the package's own HTML from a server, which GitHub Pages can't give, so it
  waits for a decision on hosting.
- **A mark of the site's own**, drawn to read at 16 px; the current one is a
  Material Symbols icon.
- **Watchlists** of packages, with notes and tags, for signed-in users.
- **Alerts** when a package's downloads or health cross a threshold.
- **Comparing packages** side by side.
- **Saved and shareable searches.**
- **Advisory details** on the package page, beyond the count of known
  vulnerabilities.
- **Other registries**, such as GitHub Packages.

## Not planned

- **Versions, tags or a changelog.** Every merge to `main` deploys; the site has
  one version, the one at <https://mypackages.dev>.
- **Packages someone "authored".** npm records the latest publisher as the
  author, which with trusted publishing is GitHub Actions, so a user's page
  shows the packages they maintain
  ([#95](https://github.com/phun-ky/mypackages.dev/issues/95)).
- **More than 500 packages per user.** The page says when a user has more
  ([#96](https://github.com/phun-ky/mypackages.dev/issues/96)).
