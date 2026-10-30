# Contributing to My packages

Thanks for taking the time to help. This guide covers how to ask, report,
suggest and change things, and what a pull request needs before it's merged.

## Code of conduct

Everyone taking part is expected to follow the
[Code of Conduct](CODE_OF_CONDUCT.md). Report unacceptable behaviour to
<code-of-conduct@phun-ky.net>.

## Asking a question

Read the [FAQ](https://mypackages.dev/help/faq) first, and search the
[issues](https://github.com/phun-ky/mypackages.dev/issues). If your question
isn't answered there, open an issue and say what you were trying to do.

## Reporting a bug

Open an issue with the bug report template. The site's error page has a "Report
it on GitHub" link that fills in the address, the time, your browser and the
error for you.

Include:

- the page's address, and what you did
- what you expected, and what happened instead
- your browser, and whether you were signed in

**Security issues are different:** don't open an issue. Report them privately,
as the [security policy](SECURITY.md) describes.

## Suggesting a change

Open an issue describing the problem first, then the change you have in mind.
Larger changes, such as a new page, a new data source or anything that stores
more about users, are discussed in the issue before work starts. Issues in this
repository follow a pattern: **Problem**, **Proposal**, **Tests** and **Deploy
impact**, and a decision from the maintainer is recorded in the issue.

## Changing the code

### Setting up

You need Node.js 24 and npm. See the [README](README.md#running-it-locally) for
running the site and every check.

```sh
npm ci
```

`npm ci` also sets `core.hooksPath` to `.githooks`, which adds your sign-off to
every commit (see below).

### Tests are required

Every feature and every fix comes with tests:

- **A fix** has a test that fails without it. Say in the pull request that you
  saw it fail.
- **A feature** has tests for what it does: unit tests (`tests/unit`, with
  [fast-check](https://fast-check.dev) for rules that hold for every input) for
  pure code, and end-to-end tests (`tests/e2e`, Playwright) for pages.
- **Edge functions** have Deno tests next to them, and **the database** has
  pgTAP tests in `supabase/tests`.

The end-to-end tests run against a build with every request mocked, so they
don't need Supabase or the network. Run the files your change touches while you
work; CI runs the whole suite in Chromium and Firefox.

### Checks

A pull request is merged when the `check` status passes. It requires lint (no
warnings), formatting, the typecheck, the build and its metadata check, the unit
tests with coverage, the end-to-end tests, the edge function checks and the
database tests. The commands are in the [README](README.md#checks).

### Style

- **TypeScript** in `src`, formatted by Prettier and linted by ESLint. Match the
  code around you: its naming, comments and structure.
- **Escape everything** that doesn't come from this code base (npm, GitHub,
  Supabase, the URL) with `escapeHtml` or `escapeAttr` before it goes into a
  template.
- **Colours** come from the tokens in `src/styles/variables.css`, so both themes
  reach everything; `npm run lint` checks it.
- **Write for people:** plain words in the interface, the docs and the commit
  messages, and say what a number means and where it comes from.

### Developer Certificate of Origin

Every commit is signed off under the
[Developer Certificate of Origin](https://developercertificate.org): by signing
off, you confirm that you wrote the change or have the right to submit it under
the project's [MIT licence](LICENSE). The hook in `.githooks` adds the
`Signed-off-by` line; without it, use `git commit -s`. A check on every pull
request refuses commits without one.

### Commits and pull requests

Commit messages follow
[Conventional Commits](https://www.conventionalcommits.org) with an emoji, as
`npm run commit` (commitizen) writes them:

| Type        | For                                | Example                                     |
| ----------- | ---------------------------------- | ------------------------------------------- |
| `feat: 🎸`  | Something new for visitors         | `feat: 🎸 Link preview images`              |
| `fix: 🐛`   | A bug fix                          | `fix: 🐛 Keep localStorage from filling up` |
| `test: 💍`  | Tests only                         | `test: 💍 Unit tests with node:test`        |
| `docs: ✏️`  | Documentation only                 | `docs: ✏️ README and contributing guide`    |
| `ci: 🎡`    | Workflows                          | `ci: 🎡 Check external links weekly`        |
| `chore: 🤖` | Tooling, dependencies and the rest | `chore: 🤖 Zero lint warnings`              |

- **One issue per branch and pull request**, with `Closes #<number>` in the
  commit body.
- **The pull request** says what changed, where the issue stands, how to test
  it, and what deploying it means (the site, the edge functions or a migration).
- **Pull requests are merged with a merge commit**, so each commit stays as
  written. Keep a fix and unrelated tooling in separate commits.

Every merge to `main` deploys; see [how it deploys](README.md#how-it-deploys).
