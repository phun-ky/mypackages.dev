# Governance

My packages is a small open source project with a single maintainer. This
document describes how decisions are made, who does what, and what happens if
the maintainer can't continue.

## Model

The project follows a **maintainer-led** model: the maintainer makes the final
decision on what goes into the site, guided by the [roadmap](ROADMAP.md) and the
discussion with contributors.

Decisions are made in public:

- **Proposals** are made as
  [GitHub issues](https://github.com/phun-ky/mypackages.dev/issues). Larger
  changes, such as a new page, a new data source or anything that stores more
  about users, are discussed in an issue before work starts. The decision is
  recorded in the issue.
- **Changes** are made as pull requests, reviewed by the maintainer, and merged
  only when the required checks pass.
- **Releases** don't exist as such: every merge to `main` deploys the site, and
  the edge functions when they change. There are no versions, tags or changelog;
  the history of `main` and the closed issues are the record.
- **Disagreements** are resolved by discussion in the issue or pull request. If
  that doesn't settle it, the maintainer decides and explains why.

## Roles

| Role            | Who                                                                        | Responsibilities                                                                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Maintainer**  | Alexander Vassbotn Røyne-Helgesen ([@phun-ky](https://github.com/phun-ky)) | Sets the direction and roadmap; triages issues; reviews and merges pull requests; applies database migrations; handles security reports; manages the repository, the Supabase project and the domain |
| **Contributor** | Anyone who opens an issue or a pull request                                | Follows the [contributing guide](CONTRIBUTING.md); includes tests with code changes; signs off every commit                                                                                          |

### Becoming a maintainer

Contributors who have made sustained, high-quality contributions may be invited
to become maintainers. A new maintainer gets write access to the repository and
is added to this document, and from then on a pull request needs a review from a
maintainer other than its author before it's merged.

Before anyone gets write access, or access to the Supabase project, the
maintainer reviews their contribution history and confirms that their GitHub
account uses two-factor authentication. They get the lowest role that lets them
do the work, and the change is recorded in the roles table above.

## Continuity

Today, one person holds everything needed to run the site: admin access to the
[GitHub repository](https://github.com/phun-ky/mypackages.dev), the Supabase
project with the database, users and edge functions, and the `mypackages.dev`
domain.

- **The site** deploys from GitHub Actions, so it keeps working, and keeps
  deploying merged changes, without the maintainer's machine.
- **The data** that matters to users, their settings and stored npm tokens, is
  in the Supabase project. Only someone with access to that project can export
  or delete it.
- **The code** is MIT-licensed. Anyone can fork it and run their own copy under
  a new name, with their own Supabase project, if this one stops.
- **A second person with access** doesn't exist yet. Until there is one, the
  site can't continue under its own name if the maintainer is unavailable, and
  users can't have their stored data deleted except by the maintainer.
