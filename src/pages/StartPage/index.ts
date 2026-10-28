import { Link } from '../../components/actions/Link';
import { SiteHeader } from '../../components/page-section/SiteHeader';
import { attachEvents } from '../../features/start/events/attach-events';
import { FrontpageSearchStatistics } from '../../features/start/frontpage-search-statistics';
import { PortfolioExample } from '../../features/start/portfolio-example';
import { addOnAfterAppRender, addOnClick } from '../../lib/spa';
import type { PagePropsType } from '../../lib/spa/types';
import { supabase } from '../../services/supabase';

import './styles/startPage.css';

const html = String.raw;

export type StartPagePropsType = PagePropsType;

const ROADMAP = 'https://github.com/phun-ky/mypackages.dev/milestones';
// Simple line icons, drawn with currentColor
const icon = (paths: string) =>
  html`<svg class="feature-icon" viewBox="0 0 24 24" aria-hidden="true">
    ${paths}
  </svg>`;
const FEATURES = [
  {
    title: 'Your portfolio, on one page',
    text: 'Monthly downloads and month-over-month change for every package, with the newest, most popular and trending ones picked out.',
    icon: icon(
      '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'
    )
  },
  {
    title: 'A health score you can trust',
    text: 'Security, maintenance, quality, provenance and popularity in one score, with a confidence level, and guardrails so a risky package never looks fine.',
    icon: icon('<path d="M3 12h4l3-7 4 14 3-7h4"/>')
  },
  {
    title: 'Known vulnerabilities',
    text: 'Advisories for the version you actually ship, from the OSV database.',
    icon: icon(
      '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>'
    )
  },
  {
    title: 'Release activity',
    text: 'A year of publishes at a glance, how often you release, and how long since the last one.',
    icon: icon(
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'
    )
  }
];
const STEPS = [
  {
    title: 'Search',
    text: 'Any package or npm user. Everything public works without an account.'
  },
  {
    title: 'Sign in with GitHub',
    text: 'Get a dashboard with the packages you track, and keep it between visits.'
  },
  {
    title: 'Add an npm token, if you like',
    text: "For complete data without rate limits. It's stored encrypted and only used by the server, never sent to your browser."
  }
];
const IS = [
  [
    'A quick, comparable overview',
    'See what deserves attention without opening every package.'
  ],
  [
    'Built on public data',
    'npm, OSV, and GitHub, GitLab, Bitbucket or Azure DevOps for repository stats.'
  ],
  [
    'Free and open source',
    'Made by one maintainer, for maintainers. The code is on GitHub.'
  ]
];
const ISNT = [
  [
    'A security audit',
    "The score helps you spot risk; it doesn't replace a review."
  ],
  [
    'Real time',
    'Upstream APIs can be slow or rate limited, so numbers can lag.'
  ],
  [
    'Cryptographic provenance checking',
    'It checks that signatures and attestations exist, not that they verify.'
  ],
  ['Affiliated with npm, Inc.', 'And it only covers the npm registry, for now.']
];
const NEXT = [
  [
    'Watchlists and pins',
    'Keep an eye on packages you depend on, not only the ones you publish.'
  ],
  [
    'Alerts',
    'Hear about a drop in downloads, a new vulnerability or a deprecation.'
  ],
  [
    'Compare packages',
    'Two packages, or this month and last year, side by side.'
  ],
  [
    'More registries',
    'GitHub Packages, Azure Artifacts, JFrog and Sonatype.',
    'Later'
  ]
];
const list = (items: string[][]) =>
  items
    .map(
      ([title, text]) =>
        html`<li><strong>${title}</strong><span>${text}</span></li>`
    )
    .join('');
// A plain string, so Prettier doesn't split an end tag over two lines,
// which diff-dom can't read (#64)
const roadmapItem = ([title, text, status = 'Planned']: string[]) =>
  `<li><strong>${title}</strong><span>${text}</span><span class="tag">${status}</span></li>`;

export const StartPage = async (
  props: StartPagePropsType,
  signal: AbortSignal
) => {
  const { session } = props;

  attachEvents(supabase, signal);
  // Coming from "How it works" on another page
  addOnAfterAppRender(() => {
    if (window.location.hash === '#how') {
      document.getElementById('how')?.scrollIntoView();
    }
  });
  // The closing call to action goes back to the search
  addOnClick('start-search', () => {
    const search = document.getElementById('query-term-to-use');

    search?.scrollIntoView({ block: 'center' });
    search?.focus({ preventScroll: true });
  });

  return html`<div class="start-page nebula-page">
    <div class="start-hero">
      ${SiteHeader({ session, onStartPage: true })}
      <section class="hero" aria-labelledby="hero-title">
        <p class="kicker">For people who publish to npm</p>
        <h1 id="hero-title">
          See how your npm packages are
          <span class="gradient-text">really doing</span>
        </h1>
        <p class="lede">
          Downloads, trends, health and security for every package you author or
          maintain, on one page. Search any package or npm user, no account
          needed.
        </p>
        <form class="hero-search" role="search" data-no-submit>
          <label for="query-term-to-use" class="visually-hidden">
            Package or npm username
          </label>
          <div class="hero-search-field">
            <input
              type="search"
              id="query-term-to-use"
              class="hero-search-input"
              placeholder="Try @phun-ky/speccer or phun-ky"
              autocomplete="off"
              data-lpignore="true"
            />
            <button type="button" id="show-me" class="pill-button is-primary">
              Show me
            </button>
          </div>
        </form>
        <ul class="examples" aria-label="Examples">
          <li>
            ${Link({ to: '/packages/@phun-ky/speccer', children: '@phun-ky/speccer' })}
          </li>
          <li>${Link({ to: '/packages/vitest', children: 'vitest' })}</li>
          <li>${Link({ to: '/users/phun-ky', children: 'phun-ky' })}</li>
        </ul>
        <p class="or">
          ${
            session
              ? html`Welcome back.
                ${Link({ to: '/dashboard', children: 'Go to your dashboard' })}.`
              : html`Maintain packages?
                ${Link({ to: '/dashboard/signin', children: 'Sign in with GitHub' })}
                to get your own dashboard.`
          }
        </p>
        <ul class="trust">
          <li>Free and open source</li>
          <li>Public data only</li>
          <li>No ads, no trackers</li>
        </ul>
      </section>
    </div>

    <div class="start-content">
      ${PortfolioExample()}

      <section class="start-section" aria-labelledby="features-title">
        <div class="section-head">
          <h2 id="features-title">What it does</h2>
        </div>
        <ul class="features">
          ${FEATURES.map(
            (f) =>
              html`<li>
                ${f.icon}
                <h3>${f.title}</h3>
                <p>${f.text}</p>
              </li>`
          ).join('')}
        </ul>
      </section>

      <section class="start-section" id="how" aria-labelledby="how-title">
        <div class="section-head"><h2 id="how-title">How it works</h2></div>
        <ol class="steps">
          ${STEPS.map(
            (s) =>
              html`<li>
                <h3>${s.title}</h3>
                <p>${s.text}</p>
              </li>`
          ).join('')}
        </ol>
      </section>

      <section class="start-section" aria-labelledby="scope-title">
        <div class="section-head">
          <h2 id="scope-title">What it is, and what it isn't</h2>
        </div>
        <div class="scope">
          <div class="scope-card is-yes">
            <h3>It is</h3>
            <ul>
              ${list(IS)}
            </ul>
          </div>
          <div class="scope-card is-no">
            <h3>It isn't</h3>
            <ul>
              ${list(ISNT)}
            </ul>
          </div>
        </div>
      </section>

      <section class="start-section" aria-labelledby="lookups-title">
        <div class="section-head">
          <h2 id="lookups-title">What people look up</h2>
        </div>
        ${await FrontpageSearchStatistics()}
      </section>

      <section class="start-section" aria-labelledby="next-title">
        <div class="section-head">
          <h2 id="next-title">Coming next</h2>
          ${Link({ to: ROADMAP, children: 'Follow the roadmap on GitHub →' })}
        </div>
        <ul class="roadmap">
          ${NEXT.map(roadmapItem).join('')}
        </ul>
      </section>

      <section class="start-cta" aria-labelledby="cta-title">
        <h2 id="cta-title">Start with one package.</h2>
        <p>
          Look up something you published, or sign in to see all of them at
          once.
        </p>
        <div class="cta-buttons">
          <button
            type="button"
            id="start-search"
            class="pill-button is-primary"
          >
            Search packages
          </button>
          ${
            session
              ? ''
              : Link({
                  to: '/dashboard/signin',
                  className: 'pill-button',
                  children: 'Sign in with GitHub'
                })
          }
        </div>
      </section>
    </div>
  </div>`;
};
