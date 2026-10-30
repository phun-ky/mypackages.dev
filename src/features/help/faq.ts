// The questions and answers on /help/faq, by topic. Answers are HTML from
// this code base, in plain template strings, so Prettier never splits an end
// tag over two lines (#64). Questions are text: `code` in backticks is the
// only markup.

export type FAQItem = { question: string; answer: string };

export type FAQTopic = { id: string; title: string; items: FAQItem[] };

/** The question that the package page links to as "How the score is worked out" */
export const SCORE_QUESTION = 'How is package health worked out?';

export const FAQ_TOPICS: FAQTopic[] = [
  {
    id: 'using-the-site',
    title: 'Using the site',
    items: [
      {
        question: 'Why should I use this site?',
        answer: `<p>This site is built to give you a <strong>full, precise overview</strong> of how your npm packages are doing, in one place.</p>
<p>I originally created the first version just for myself because I needed a better way to understand <strong>usage and downloads</strong> across my packages. I couldn't find a good alternative, and the npmjs.com profile page felt limited: you often have to click into each package just to see a simple weekly downloads graph.</p>
<p>With this site, you can quickly get an overview of:</p>
<ul>
  <li>Packages you <strong>maintain</strong></li>
</ul>
<p>After that proved useful, I turned it into a standalone site and added features like:</p>
<ul>
  <li><strong>Package health</strong> (a combined view of signals like security, maintenance, quality, provenance, and popularity)</li>
  <li>A <strong>logged-in dashboard</strong> so you can follow your own package set over time</li>
  <li><strong>GitHub login via Supabase</strong> to keep sign-in simple and secure</li>
</ul>
<p>If you care about understanding your packages beyond a single weekly graph, and want an at-a-glance dashboard for everything you build or maintain, this site is for you.</p>`
      },
      {
        question: 'What is this site?',
        answer:
          '<p>This site gives you a single place to track how npm packages you maintain are doing, including downloads, trends, and package health signals.</p>'
      },
      {
        question: 'Why should I use this site instead of npmjs.com?',
        answer:
          "<p>npmjs.com is great for package pages, but it's limited for portfolio-level insights. This site focuses on giving you a precise overview across many packages at once, so you can spot trends and issues faster.</p>"
      },
      {
        question: 'What is included in the dashboard?',
        answer:
          '<p>The dashboard aggregates the packages you maintain and surfaces key metrics like downloads over time, changes, and health and security signals in one view.</p>'
      },
      {
        question: 'What data sources do you use?',
        answer:
          '<p>We primarily use npm registry data for package metadata and downloads, OSV for known vulnerabilities, and GitHub data for repository-level signals when a package has a valid repository URL.</p>'
      }
    ]
  },
  {
    id: 'finding-packages',
    title: 'Finding packages',
    items: [
      {
        question: "I've searched for a package, but it's not found?",
        answer: `<p>A few things can cause this:</p>
<ul>
  <li><strong>Spelling and scope:</strong> double-check the exact name. Scoped packages must include the scope (for example <code>@scope/name</code>).</li>
  <li><strong>Not published (or unpublished):</strong> the package might not exist on npm, may have been unpublished, or could be newly published and not yet visible everywhere.</li>
  <li><strong>Different registry or source:</strong> some packages exist only on GitHub (or another registry) and won't show up as an npm package.</li>
  <li><strong>Package is deprecated:</strong> npm's search doesn't return deprecated packages. To look for them, add them in your <a href="/profile" data-link>profile, under "Ensured Packages"</a>.</li>
  <li><strong>Rate limiting or temporary lookup issues:</strong> if npm or GitHub is rate limiting, lookups can fail or be delayed.</li>
</ul>
<p>If you think it <em>should</em> exist, try:</p>
<ol>
  <li>Search again with the exact package name.</li>
  <li>Open the package directly on npm (or GitHub) to confirm it exists.</li>
  <li>Try again a little later if it was just published.</li>
</ol>
<p>If it still doesn't show up, <a href="/help/feedback" data-link>send feedback</a> with the exact package name you searched for (including scope) and whether you expected it on <strong>npm</strong> or <strong>GitHub</strong>.</p>`
      },
      {
        question: "Why can't I find deprecated packages via search?",
        answer:
          '<p>npm\'s search endpoint doesn\'t return deprecated packages. To track deprecated packages here, add them in your <a href="/profile" data-link>profile under "Ensured Packages"</a>.</p>'
      },
      {
        question: 'Why do search results sometimes look incomplete or delayed?',
        answer:
          '<p>We rely on upstream APIs (npm and GitHub). If they rate limit or have temporary issues, results may be incomplete until the next successful lookup.</p>'
      }
    ]
  },
  {
    id: 'downloads-and-vulnerabilities',
    title: 'Downloads and vulnerabilities',
    items: [
      {
        question:
          'Why are only the packages someone maintains shown, and not the ones they "authored"?',
        answer:
          "<p>The site lists the packages a user is a maintainer of on npm, which is who can publish them. There used to be an author mode too, but npm's search matches an author by whoever published a package's latest version, not by the <code>author</code> field in its package.json.</p><p>With trusted publishing from GitHub Actions, which npm recommends, npm records the publisher as GitHub Actions, so every release made that way took a package off its author's list. A package someone wrote but no longer maintains isn't shown.</p>"
      },
      {
        question: 'Where do download numbers come from, and what do they mean?',
        answer:
          "<p>Every download number on a package or user page comes from npm's downloads API, which counts how many times the package's tarball was downloaded each day. That includes installs by CI, mirrors and other automation, so it's a sign of use, not a count of people.</p><p>The big number is the downloads in the last complete calendar month, and is labelled with that month. The change compares it with the month before, and the charts show the last 12 complete months, so all three agree. The current month is left out until it's over. npm's data lags by a day or two, so each page says the day it runs to.</p><p>The one exception is the users on the discovery page, whose number is npm's search figure for the last 30 days, since the downloads API would take a request for every package of every user shown.</p>"
      },
      {
        question:
          'Why do my download numbers differ from what I see on npmjs.com?',
        answer:
          "<p>npmjs.com shows the downloads for the last 7 days on a package's page, while this site shows calendar months, so the windows differ. Both come from npm's downloads API, so the downloads for the same days are the same.</p>"
      },
      {
        question: 'How do you check for vulnerabilities?',
        answer: `<p>We check vulnerabilities by querying <strong>OSV (Open Source Vulnerabilities)</strong> for the <strong>specific package version</strong> shown on the page (typically the <code>latest</code> dist-tag).</p>
<p>In practice, that means:</p>
<ul>
  <li>We take the package name and the resolved version.</li>
  <li>We fetch vulnerability data from OSV for that exact npm package and version.</li>
  <li>We turn the returned vulnerabilities into a <strong>Security</strong> score, which is shown on the package page and counts towards the overall health score.</li>
</ul>
<p>If OSV data can't be fetched (network issues, rate limits and so on), Security falls back to <strong>Unknown</strong> with a neutral score, and the page says that security data is unavailable.</p>`
      }
    ]
  },
  {
    id: 'package-health',
    title: 'Package health',
    items: [
      {
        question: SCORE_QUESTION,
        answer: `<p>Package health is a weighted average, from 0 to 100, of up to five scores: <strong>Security</strong>, <strong>Maintenance</strong>, <strong>Quality</strong>, <strong>Provenance</strong> and <strong>Popularity</strong>. Caps are applied after that, and the result is rounded.</p>
<p>If a score is missing, it's left out and the remaining weights are scaled up so they still add up to 100%. If none are available, the label is <strong>Unknown</strong>, with a score of 50 and a confidence of 0.</p>
<p>Security under 40 also caps the overall score at 60, even when provenance is high, so provenance can't make up for risk.</p>
<h4>How each score is worked out</h4>
<ul>
  <li><strong>Security:</strong> based on vulnerabilities fetched from OSV for the package and version. If they can't be fetched, Security is "Unknown" with a score of 50.</li>
  <li><strong>Maintenance:</strong> combines how recently it was published (65%) and how regularly it's released (35%). It can get a small boost for stable, heavily used packages, and a penalty if very old. Deprecated packages score 5.</li>
  <li><strong>Quality:</strong> from package metadata like types, tests, exports, ESM, the Node engines field, license, repository and README size. Deprecated packages score 5.</li>
  <li><strong>Provenance:</strong> from the dist metadata (integrity, signatures, attestations and the SLSA predicate type). It checks that they're present, not that they verify.</li>
  <li><strong>Popularity:</strong> from monthly downloads, using thresholds and log scaling at the high end, so huge numbers don't instantly pin it at 100.</li>
</ul>
<p>On a package page, each score is shown with the reason behind it, next to the overall score with the caps applied.</p>`
      },
      {
        question: 'What does "confidence" mean in package health?',
        answer:
          '<p>Confidence is how much data was available to calculate the health score: the sum of the weights of the scores that were there. For example, if only Security (30%) and Quality (25%) were available, confidence is <strong>55%</strong>.</p>'
      },
      {
        question: 'Can a package still be "healthy" if it has vulnerabilities?',
        answer:
          '<p>Security heavily influences health. Low security scores cap the overall result, so a risky package can\'t appear "Excellent" even if other signals look strong.</p>'
      },
      {
        question:
          'Do you cryptographically verify provenance (signatures and attestations)?',
        answer:
          '<p>Not currently. Provenance is presence-based: we detect whether integrity, signatures and attestations are present in the dist metadata. Verification may be added later.</p>'
      }
    ]
  },
  {
    id: 'github-data',
    title: 'GitHub data',
    items: [
      {
        question: 'When do you fetch GitHub data for a package?',
        answer:
          '<p>If a package has a valid repository URL, we fetch repository stats such as stars and open issues to enrich the package page.</p>'
      },
      {
        question: 'Why are stars or issues sometimes missing?',
        answer:
          '<p>GitHub stats need a valid repository URL and a successful GitHub API lookup. Missing or invalid URLs, or rate limits, can stop the data from loading.</p>'
      }
    ]
  },
  {
    id: 'accounts-and-privacy',
    title: 'Accounts and privacy',
    items: [
      {
        question: 'Why do I need to log in?',
        answer:
          "<p>You don't, to look up packages and users. Logging in gives you a personal dashboard where you can track the packages you maintain, save settings, and use account-specific features.</p>"
      },
      {
        question: 'How does GitHub login work?',
        answer:
          '<p>Authentication is handled by Supabase, with GitHub as the identity provider. We use it to identify you and connect your dashboard to your package set.</p>'
      },
      {
        question: 'Do you store my GitHub data or tokens?',
        answer:
          "<p>We use GitHub login via Supabase for authentication. We don't need your personal access tokens for normal usage. Any stored account data is limited to what's required to provide your dashboard features.</p>"
      },
      {
        question: 'What data do you collect and why?',
        answer:
          '<p>We may store basic account information needed for login and dashboard functionality, plus operational data required to run the service. Package, download and health data is retrieved from public sources (npm, GitHub and OSV).</p>'
      },
      {
        question: 'Can I delete my account or data?',
        answer:
          '<p>Yes. You should be able to remove your account and associated dashboard data. Public package data is not owned by your account and will still exist in its original sources.</p>'
      }
    ]
  }
];

/** An id for a question, for its link: "Why do I need to log in?" is "why-do-i-need-to-log-in" */
export const questionId = (question: string) =>
  question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
