/* eslint-disable @typescript-eslint/no-explicit-any */
import { codeToHtml } from 'shiki';

import { Link } from '../../components/actions/Link';
import { Alert } from '../../components/feedback/Alert';
import { Container } from '../../components/layout/Container';
import { PROJECT_REPO_SITE_URL } from '../../constants';
import { buildBugReportUrl } from '../../features/bugs/build-github-issue-url';
import type { PagePropsType } from '../../lib/spa/types';
import { truncateText } from '../../utils/truncate-text';

import './styles/errorPage.css';

const html = String.raw;

export const ErrorPage = async (props: PagePropsType, signal: AbortSignal) => {
  console.log(signal);

  const { error } = props;

  if (!error) {
    return html`<section class="error-page">
      <header class="error-hero">
        ${Container({
          size: 'small',
          children: html`<div class="inner">
            <h1>Something went wrong</h1>
          </div> `
        })}
      </header>
      ${Container({
        size: 'small',
        children: html`<div class="inner">
          <h2>Error</h2>
          <p>No specific error found.</p>
          ${Link({
            className: 'button primary',
            to: `${PROJECT_REPO_SITE_URL}/issues/new`,
            children: html`<svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 -960 960 960"
              >
                <path
                  d="M480-200q66 0 113-47t47-113v-160q0-66-47-113t-113-47-113 47-47 113v160q0 66 47 113t113 47m-73.85-130h147.7v-60h-147.7zm0-160h147.7v-60h-147.7zM480-140q-59.61 0-110.11-29.31T289.69-250H180v-60h87.08q-6.08-24.61-6.58-49.81Q260-385 260-410h-80v-60h80q0-25.38.12-50.58.11-25.19 6.96-49.42H180v-60h109.69q14.39-24.54 34-44.73 19.62-20.19 44.93-34.04l-67.85-69.08 41.38-41.38L427.39-734q25.69-7.84 51.99-7.84 26.31 0 52 7.84l87.23-85.23L660-777.85l-69.08 69.08q25.31 13.85 45.16 33.73 19.84 19.89 34.23 45.04H780v60h-87.08q6.85 24.23 6.96 49.42.12 25.2.12 50.58h80v60h-80q0 25-.5 50.19-.5 25.2-6.58 49.81H780v60H670.31q-29.7 51.38-80.2 80.69T480-140"
                />
              </svg>
              Report bug`
          })}
        </div> `
      })}
    </section>`;
  }

  const code = truncateText(error?.stack || '(no stacktrace)');
  const pageUrl =
    typeof window !== 'undefined' ? window.location.href : '(unknown)';
  const userAgent =
    typeof navigator !== 'undefined' ? navigator.userAgent : '(unknown)';
  const timestamp = new Date().toISOString();
  const issueTitle = `${error?.name ?? 'Error'}: ${String((error as any)?.message ?? error).slice(0, 80)}`;
  const issueBody = [
    '**Describe the bug**',
    '<!-- What happened? -->',
    `${error?.toString() ?? 'Error'}`,
    '',
    '**To Reproduce**',
    `1. Go to '${pageUrl}'`,
    '2. ...',
    '',
    '**Expected behaviour**',
    '...',
    '',
    '**Additional context**',
    '...',
    '',
    '---',
    '### Diagnostics (auto-filled)',
    `- Time: ${timestamp}`,
    `- URL: ${pageUrl}`,
    `- User agent: ${userAgent}`,
    '',
    '### Stacktrace',
    '```text',
    code,
    '```',
    ''
  ].join('\n');
  const reportUrl = buildBugReportUrl({
    title: issueTitle,
    body: issueBody
  });
  const button = Link({
    className: 'button primary',
    to: reportUrl,
    children: html`<svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 -960 960 960"
      >
        <path
          d="M480-200q66 0 113-47t47-113v-160q0-66-47-113t-113-47-113 47-47 113v160q0 66 47 113t113 47m-73.85-130h147.7v-60h-147.7zm0-160h147.7v-60h-147.7zM480-140q-59.61 0-110.11-29.31T289.69-250H180v-60h87.08q-6.08-24.61-6.58-49.81Q260-385 260-410h-80v-60h80q0-25.38.12-50.58.11-25.19 6.96-49.42H180v-60h109.69q14.39-24.54 34-44.73 19.62-20.19 44.93-34.04l-67.85-69.08 41.38-41.38L427.39-734q25.69-7.84 51.99-7.84 26.31 0 52 7.84l87.23-85.23L660-777.85l-69.08 69.08q25.31 13.85 45.16 33.73 19.84 19.89 34.23 45.04H780v60h-87.08q6.85 24.23 6.96 49.42.12 25.2.12 50.58h80v60h-80q0 25-.5 50.19-.5 25.2-6.58 49.81H780v60H670.31q-29.7 51.38-80.2 80.69T480-140"
        />
      </svg>
      Report bug`
  });
  const highlighted = await codeToHtml(code, {
    lang: 'plain',
    theme: 'material-theme-ocean'
  });

  return html`<section class="error-page">
    <header class="error-hero">
      ${Container({
        size: 'small',
        children: html`<div class="inner">
          <h1>Something went wrong</h1>
        </div> `
      })}
    </header>
    ${Container({
      size: 'small',
      children: html`<div class="inner">
        <h2>Error</h2>
        ${Alert({
          type: 'caution',
          description: error.toString()
        })}
        <h2>Stacktrace</h2>
        ${highlighted} ${button}
      </div> `
    })}
  </section>`;
};
