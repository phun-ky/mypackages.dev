import type { FAQCategoryEntries } from '../types';

const html = String.raw;

export const getQuestionsAndAnswers = () => {
  const faqItems: FAQCategoryEntries = [
    {
      Site: {
        General: [
          {
            question: 'Why should I use this site?',
            answer:
              "<p>This site is built to give you a <strong>full, precise overview</strong> of how your npm packages are doing, in one place.</p>\n\n<p>I originally created the first version just for myself because I needed a better way to understand <strong>usage and downloads</strong> across my packages. I couldn't find a good alternative, and the npmjs.com profile page felt limited: you often have to click into each package just to see a simple weekly downloads graph.</p>\n\n<p>With this site, you can quickly get an overview of:</p>\n<ul>\n  <li>Packages you've <strong>authored</strong></li>\n  <li>Packages you <strong>maintain</strong></li>\n</ul>\n\n<p>After that proved useful, I turned it into a standalone site and added features like:</p>\n<ul>\n  <li><strong>Package health</strong> (a combined view of signals like security, maintenance, quality, provenance, and popularity)</li>\n  <li>A <strong>logged-in dashboard</strong> so you can follow your own package set over time</li>\n  <li><strong>GitHub login via Supabase</strong> to keep sign-in simple and secure</li>\n</ul>\n\n<p>If you care about understanding your packages beyond a single weekly graph, and want an at-a-glance dashboard for everything you build or maintain, this site is for you.</p>"
          },
          {
            question: 'What is this site?',
            answer:
              '<p>This site gives you a single place to track how npm packages you author or maintain are doing — including downloads, trends, and package health signals.</p>'
          },
          {
            question: 'Why should I use this site instead of npmjs.com?',
            answer:
              "<p>npmjs.com is great for package pages, but it's limited for portfolio-level insights. This site focuses on giving you a precise overview across many packages at once, so you can spot trends and issues faster.</p>"
          },
          {
            question: 'What is included in the dashboard?',
            answer:
              '<p>The dashboard aggregates your packages (authored or maintained) and surfaces key metrics like downloads over time, changes, and health/security signals in one view.</p>'
          },
          {
            question: 'What data sources do you use?',
            answer:
              '<p>We primarily use npm registry data for package metadata and downloads, and GitHub data for repository-level signals when a package has a valid repository URL.</p>'
          }
        ],
        Search: [
          {
            question: "I've searched for a package, but it's not found?",
            answer: html`<p>A few things can cause this:</p>

              <ul>
                <li>
                  <strong>Spelling &amp; scope:</strong> Double-check the exact
                  name. Scoped packages must include the scope (for example
                  <code>@scope/name</code>).
                </li>
                <li>
                  <strong>Not published (or unpublished):</strong> The package
                  might not exist on npm, may have been unpublished, or could be
                  newly published and not yet visible everywhere.
                </li>
                <li>
                  <strong>Different registry/source:</strong> Some packages
                  exist only on GitHub (or another registry) and won't show up
                  as an npm package.
                </li>
                <li>
                  <strong>Package is deprecated:</strong> If a package is
                  deprecated, it is impossible to find it with npm's search
                  endpoint. To be able to look for deprecated packages, you need
                  to add them in the
                  <a href="/profile" data-link
                    >profile, under 'Ensured Packages'</a
                  >.
                </li>
                <li>
                  <strong>Rate limiting or temporary lookup issues:</strong> If
                  npm/GitHub is rate limiting, lookups can fail or be delayed.
                </li>
              </ul>

              <p>If you think it <em>should</em> exist, try:</p>

              <ol>
                <li>Search again with the exact package name.</li>
                <li>
                  Open the package directly on npm (or GitHub) to confirm it
                  exists.
                </li>
                <li>Try again a little later if it was just published.</li>
              </ol>

              <p>
                If it still doesn't show up, share the exact package name you
                searched for (including scope) and whether you expected it on
                <strong>npm</strong> or <strong>GitHub</strong>.
              </p> `
          },
          {
            question: "Why can't I find deprecated packages via search?",
            answer:
              '<p>npm\'s search endpoint doesn\'t return deprecated packages. To track deprecated packages here, add them in your <a href="/profile" data-link>profile under "Ensured Packages"</a>.</p>'
          },
          {
            question:
              'Why do search results sometimes look incomplete or delayed?',
            answer:
              '<p>We rely on upstream APIs (npm/GitHub). If they rate limit or have temporary issues, results may be incomplete until the next successful lookup.</p>'
          }
        ]
      },
      Npm: {
        Package: [
          {
            question: 'What counts as an "authored" vs "maintained" package?',
            answer:
              '<p>"Authored" typically means you\'re listed as the package author/publisher in npm metadata, while "maintained" means you\'re listed as a maintainer for that package.</p>'
          },
          {
            question:
              'Where do download numbers come from, and what do they mean?',
            answer:
              "<p>Download stats come from npm's downloads APIs and are aggregated into monthly and historical views. They represent npm download counts, which are a proxy for usage (but can include CI and automation).</p>"
          },
          {
            question:
              'Why do my download numbers differ from what I see on npmjs.com?',
            answer:
              '<p>Different pages may show different time windows (daily/weekly/monthly). We focus on longer history and normalized comparisons, which can make the numbers appear different depending on the selected interval.</p>'
          },

          {
            question: 'How do you check for vulnerabilities?',
            answer:
              "<p>We check vulnerabilities by querying <strong>OSV (Open Source Vulnerabilities)</strong> for the <strong>specific package version</strong> shown on the page (typically the latest <code>dist-tag</code>).</p>\n\n<p>In practice, that means:</p>\n<ul>\n  <li>We take the package name and the resolved version (for example, <code>latest</code>).</li>\n  <li>We fetch vulnerability data from OSV for that exact npm package + version.</li>\n  <li>We convert the returned vulnerabilities into a <strong>Security</strong> result (label + score) that's shown in the Security card and contributes to the overall health score.</li>\n</ul>\n\n<p>If OSV data can't be fetched (network issues, rate limits, etc.), we fall back to <strong>Unknown</strong> with a neutral score, and show that security data is unavailable.</p>"
          }
        ],
        Health: [
          {
            question:
              'On the package page, for example `/packages/@hybrid-compute/remote`, I see a package health box, how do you calculate package health?',
            answer: html`<p>
                Package health is a weighted score (0-100) built from up to five
                sub-scores: <strong>Security</strong>,
                <strong>Maintenance</strong>, <strong>Quality</strong>,
                <strong>Provenance</strong>, and <strong>Popularity</strong>.
              </p>

              <h5>Inputs and weights</h5>
              <p>
                When a sub-score is available, it contributes to the total with
                these default weights:
              </p>
              <ul>
                <li><strong>Security:</strong> 30%</li>
                <li><strong>Maintenance:</strong> 25%</li>
                <li><strong>Quality:</strong> 25%</li>
                <li><strong>Provenance:</strong> 10%</li>
                <li><strong>Popularity:</strong> 10%</li>
              </ul>
              <p>
                If any sub-score is missing, we
                <strong>re-normalize</strong> the remaining weights so the total
                is still a proper weighted average.
              </p>

              <h5>Overall score calculation</h5>
              <p>
                We compute a weighted average of the available sub-scores, apply
                guardrails (see below), and round to an integer between 0 and
                100.
              </p>

              <h5>Guardrails (caps)</h5>
              <p>To avoid misleading "healthy" results in risky situations:</p>
              <ul>
                <li>
                  <strong>Deprecated packages:</strong> if Maintenance is marked
                  as <code>deprecated</code>, overall health is capped at
                  <strong>15</strong>.
                </li>
                <li>
                  <strong>Low security caps overall health:</strong>
                  <ul>
                    <li>
                      if Security &lt; <strong>40</strong>, overall health is
                      capped at <strong>55</strong> ("Risk" cap)
                    </li>
                    <li>
                      else if Security &lt; <strong>60</strong>, overall health
                      is capped at <strong>75</strong> ("Watch" cap)
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Provenance can't override risk:</strong> if Security
                  &lt; <strong>40</strong>, overall health is also capped at
                  <strong>60</strong>, even if provenance is high.
                </li>
              </ul>

              <h5>Health label thresholds</h5>
              <ul>
                <li><strong>Excellent:</strong> 85-100</li>
                <li><strong>Good:</strong> 70-84</li>
                <li><strong>OK:</strong> 50-69</li>
                <li><strong>Poor:</strong> 0-49</li>
                <li>
                  <strong>Unknown:</strong> if no sub-scores were available (we
                  show score 50, confidence 0)
                </li>
              </ul>

              <h5>Confidence</h5>
              <p>
                Confidence indicates how much data we had. It's the sum of
                weights for the sub-scores that were present, expressed as a
                percentage.
              </p>
              <p>
                <em>Example:</em> if only Security (30%) and Quality (25%) were
                available, confidence is <strong>55%</strong>.
              </p>

              <h5>How each sub-score is computed</h5>
              <ul>
                <li>
                  <strong>Security (0-100):</strong> based on vulnerabilities
                  fetched from OSV for the package + version. If we can't fetch
                  data, Security becomes "Unknown" with score 50.
                </li>
                <li>
                  <strong>Maintenance (0-100):</strong> combines publish
                  <strong>recency</strong> (65%) and release
                  <strong>cadence</strong> (35%). It can get a small boost for
                  stable, heavily-used packages and a penalty if very old.
                  Deprecated packages score 5.
                </li>
                <li>
                  <strong>Quality (0-100):</strong> derived from package
                  metadata signals like Types/TS support, tests, exports, ESM,
                  Node engine field, license, repo presence, and README size.
                  Deprecated packages score 5.
                </li>
                <li>
                  <strong>Provenance (0-100):</strong> presence-based scoring
                  from dist metadata (integrity, signatures, attestations, and
                  SLSA predicate type). It does not cryptographically verify
                  signatures/attestations (yet).
                </li>
                <li>
                  <strong>Popularity (0-100):</strong> derived from monthly
                  downloads using thresholds (low/relative-low/decent) and log
                  scaling at the high end so huge numbers don't instantly pin at
                  100.
                </li>
              </ul>

              <p>
                In the UI, the small cards (Security/Quality/etc.) show the
                individual sub-scores, while the main health score is the
                weighted aggregate with the guardrails applied.
              </p>`
          },
          {
            question: 'What does "confidence" mean in package health?',
            answer:
              '<p>Confidence reflects how much data was available to calculate the health score. If some metrics are missing, confidence is lower.</p>'
          },
          {
            question:
              'Can a package still be "healthy" if it has vulnerabilities?',
            answer:
              '<p>Security heavily influences health. Low security scores cap the overall health result so a risky package can\'t appear "Excellent" even if other signals look strong.</p>'
          },
          {
            question:
              'Do you cryptographically verify provenance (signatures/attestations)?',
            answer:
              '<p>Not currently. Provenance is presence-based: we detect whether integrity/signatures/attestations are present in dist metadata. Verification may be added later.</p>'
          }
        ]
      },
      Github: {
        Repo: [
          {
            question: 'When do you fetch GitHub data for a package?',
            answer:
              '<p>If a package has a valid repository URL, we fetch repository stats such as stars and open issues to enrich the package page.</p>'
          },
          {
            question: 'Why are stars or issues sometimes missing?',
            answer:
              '<p>GitHub stats require a valid repository URL and successful GitHub API lookups. Missing/invalid URLs or rate limits can prevent the data from loading.</p>'
          }
        ]
      },
      Account: {
        Login: [
          {
            question: 'Why do I need to log in?',
            answer:
              '<p>Logging in enables a personalized dashboard where you can track your authored and maintained packages, save settings, and use account-specific features.</p>'
          },
          {
            question: 'How does GitHub login work?',
            answer:
              '<p>Authentication is handled via Supabase with GitHub as the identity provider. We use it to identify you and connect your dashboard to your package set.</p>'
          }
        ]
      },
      Privacy: {
        Legal: [
          {
            question: 'Do you store my GitHub data or tokens?',
            answer:
              "<p>We use GitHub login via Supabase for authentication. We don't need your personal access tokens for normal usage. Any stored account data is limited to what's required to provide your dashboard features.</p>"
          },
          {
            question: 'What data do you collect and why?',
            answer:
              '<p>We may store basic account information needed for login and dashboard functionality, plus operational data required to run the service. Package/download/health data is retrieved from public sources (npm/GitHub/OSV).</p>'
          },
          {
            question: 'Can I delete my account or data?',
            answer:
              '<p>Yes. You should be able to remove your account and associated dashboard data. Public package data is not owned by your account and will still exist in its original sources.</p>'
          }
        ]
      }
    }
  ];
  return faqItems;
};
