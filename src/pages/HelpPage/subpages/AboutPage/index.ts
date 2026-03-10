import { Link } from '../../../../components/actions/Link';
import { Container } from '../../../../components/layout/Container';
import type { PagePropsType } from '../../../../lib/spa/types';

import './style/aboutPage.css';

const html = String.raw;

export const AboutPage = async (props: PagePropsType, signal: AbortSignal) => {
  console.log(props, signal);

  return html`<section class="about-page">
    <header class="about-hero">
      ${Container({
        size: 'small',
        children: html`
          <div class="inner">
            ${Link({
              to: '/help',
              className: 'button back-to ghost',
              children: html`<svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 -960 960 960"
                  fill="currentColor"
                >
                  <path
                    d="m294.92-450 227.85 227.85L480-180 180-480l300-300 42.77 42.15L294.92-510H780v60H294.92Z"
                  />
                </svg>
                Back to Help`
            })}
            <div class="title-container">
              <span class="eyebrow">About</span>
              <h1>Track your npm packages without the busywork</h1>
            </div>
            <p class="lead">
              A focused dashboard for packages you author or maintain,
              downloads, trends, health signals, and security context in one
              place.
            </p>

            <div class="flex gap-1">
              <a class="button primary" href="/dashboard" data-link>
                Open dashboard
              </a>
              <a class="button" href="/search" data-link> Search packages </a>
            </div>

            <ul class="hero-highlights">
              <li>
                <strong>Portfolio overview</strong> across all your packages
              </li>
              <li>
                <strong>Health signals</strong> with confidence and guardrails
              </li>
              <li><strong>Security checks</strong> backed by OSV</li>
            </ul>
          </div>
        `
      })}
    </header>
    ${Container({
      size: 'small',
      children: html`
        <h2>About</h2>

        <p>
          This site started as a personal tool. I wanted a better way to
          understand how my npm packages were doing, not just a single weekly
          downloads graph, but a precise overview across everything I've
          authored or maintained.
        </p>

        <p>
          When I couldn't find a good alternative, I built one. The goal is
          simple: make it easy to see what's happening across your packages
          without clicking into each one. Downloads, trends, and key signals
          should be visible at a glance.
        </p>

        <p>
          Over time it grew into a stand-alone site with a dashboard and extra
          signals like package health. Authentication is handled via GitHub
          login through Supabase, so you can quickly get a personalized view of
          the packages you care about.
        </p>

        <p>
          Package health is designed as a practical summary, combining signals
          like security, maintenance, quality, provenance, and popularity, with
          guardrails to avoid "everything is fine" scores when security looks
          risky. It's not meant to replace deep audits, but to help you spot
          what deserves attention.
        </p>

        <p>
          If you maintain libraries, publish frequently, or just want a better
          overview of your package portfolio, I hope this becomes the place you
          check first.
        </p>

        <span class="hr" role="presentation"></span>
        <h3>What you get</h3>
        <ul>
          <li>
            A portfolio view of packages you've <strong>authored</strong> or
            <strong>maintain</strong>
          </li>
          <li>
            Downloads and trends you can compare across packages (without
            clicking into each one)
          </li>
          <li>
            Package health signals to quickly spot risk, neglect, or
            "looks-good-on-paper" situations
          </li>
          <li>
            Extra context from public sources (like vulnerability information
            and repository stats when available)
          </li>
        </ul>
        <span class="hr" role="presentation"></span>
        <h3>How it works</h3>
        <p>
          The site combines public data from multiple sources and presents it in
          a way that's easier to compare and reason about at a glance.
        </p>

        <ul>
          <li><strong>npm:</strong> registry metadata + download history</li>
          <li>
            <strong>OSV:</strong> vulnerability data for specific package
            versions
          </li>
          <li>
            <strong>GitHub:</strong> repository stats (like stars and open
            issues) when a valid repo URL is available
          </li>
        </ul>
        <span class="hr" role="presentation"></span>
        <h3>Package health</h3>
        <p>
          Package health is a summary score built from multiple signals
          (Security, Maintenance, Quality, Provenance, and Popularity). It also
          includes a <strong>confidence</strong> indicator that reflects how
          much data was available to compute the score.
        </p>
        <p>
          It's meant as a quick signal, not a final verdict. If you want the
          details, the full scoring model is described in the FAQ.
        </p>
        <span class="hr" role="presentation"></span>
        <h3>What it's not</h3>
        <ul>
          <li>
            It's not a replacement for deep security audits or manual review
          </li>
          <li>
            It's not guaranteed real-time, upstream APIs can be slow or rate
            limited
          </li>
          <li>
            Provenance is currently based on <strong>presence</strong> of
            metadata (signatures/attestations), not cryptographic verification
            (yet)
          </li>
        </ul>
        <span class="hr" role="presentation"></span>
        <h3>Privacy & accounts</h3>
        <p>
          Signing in is optional, but it enables a personalized dashboard.
          Authentication is handled via GitHub through Supabase.
        </p>
        <p>
          The site primarily displays public package data. Any stored account
          data is limited to what's needed to provide dashboard features.
        </p>
        <span class="hr" role="presentation"></span>
        <h3>Feedback & ideas</h3>
        <p>
          If you find something off, missing, or you have feature ideas, I'd
          love to hear it. The site grew out of a real need, and feedback helps
          steer what to build next.
        </p>
        <span class="hr" role="presentation"></span>
        <h3>What's next</h3>
        <ul>
          <li>Alerts (vulnerability changes, download spikes/drops)</li>
          <li>Better comparisons and saved views across packages</li>
          <li>More provenance verification and richer supply-chain signals</li>
          <li>Export/shareable reports</li>
        </ul>
      `
    })}
  </section>`;
};
