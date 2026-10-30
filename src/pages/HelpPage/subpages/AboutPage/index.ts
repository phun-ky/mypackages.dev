import {
  faqLink,
  sourceCards,
  weightsBar
} from '../../../../features/help/sections';

import '../../styles/helpPage.css';

const REPOSITORY = 'https://github.com/phun-ky/mypackages.dev';
// Plain template strings, not `html`, so Prettier never splits an end tag
// over two lines, which diff-dom can't read (#64)
const hero = `<div class="help-hero">
  <span class="help-eyebrow">About</span>
  <h1>About My packages</h1>
  <p class="help-lede">A personal tool for keeping an eye on npm packages, which grew into a site anyone can use.</p>
  <div class="help-row"><a class="pill-button is-primary" href="/" data-link>Search packages</a><a class="pill-button" href="/help/faq" data-link>Questions and answers</a></div>
</div>`;
const health =
  () => `<section class="help-block" aria-labelledby="health-title">
  <h2 id="health-title">Package health</h2>
  <div class="help-card help-score">
    <p>One score from 0 to 100. Each part counts this much, and caps keep a risky package from looking fine.</p>
    ${weightsBar()}
    <p><a href="${faqLink('how-is-package-health-worked-out')}" data-link>How the score is worked out</a></p>
  </div>
</section>`;
const story = `<section class="help-block help-two" aria-label="The site and its maker">
  <div class="help-card">
    <h2>Why it exists</h2>
    <div class="help-prose">
      <p>This site started as a tool for myself. I wanted to know how my npm packages were doing: not one weekly downloads graph per package, but an overview of everything I've authored or maintain.</p>
      <p>I couldn't find a good alternative, so I built one. It grew into this site, with package health, a dashboard after signing in, and pages for any npm package or user.</p>
    </div>
  </div>
  <div class="help-stack">
    <div class="help-card">
      <h2 class="visually-hidden">Who makes it</h2>
      <div class="help-who"><span class="help-avatar" aria-hidden="true">PK</span><p>Made and maintained by <a href="/users/phun-ky" data-link>phun-ky</a>, as an open source project on GitHub.</p></div>
      <div class="help-row"><a class="pill-button is-primary" href="/help/feedback" data-link>Send feedback</a><a class="pill-button" href="${REPOSITORY}" target="_blank" rel="noopener noreferrer">Source on GitHub</a></div>
    </div>
    <div class="help-card">
      <h2>Accounts and privacy</h2>
      <div class="help-prose">
        <p>Signing in is optional. It gives you a dashboard of your own packages, with GitHub sign-in through Supabase.</p>
        <p>The site shows public package data. What it stores for an account is only what the dashboard needs.</p>
      </div>
    </div>
  </div>
</section>`;
const limits = `<section class="help-block" aria-labelledby="limits-title">
  <div class="help-card">
    <h2 id="limits-title">Good to know</h2>
    <ul class="help-prose">
      <li>It's a quick signal, not a security audit or a manual review.</li>
      <li>It isn't real time. npm and GitHub can be slow, or limit how much the site can fetch.</li>
      <li>Provenance checks that signatures and attestations are present. It doesn't verify them cryptographically yet.</li>
    </ul>
  </div>
</section>`;

/**
 * About the site (#63), as a help centre: where the data comes from and what
 * the score is up front, then why the site exists and who makes it. What the
 * site does and doesn't do is on the front page, so it isn't repeated here.
 */
export const AboutPage = async () =>
  `<div class="help-page nebula-page">
  <div class="help-wrap">
    ${hero}
    <section class="help-block" aria-labelledby="sources-title"><h2 id="sources-title">Where the data comes from</h2>${sourceCards()}</section>
    ${health()}
    ${story}
    ${limits}
  </div>
</div>`;
