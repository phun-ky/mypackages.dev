import { buildBugReportUrl } from '../../features/bugs/build-github-issue-url';
import { addOnClick } from '../../lib/spa';
import type { PagePropsType } from '../../lib/spa/types';
import { renderCurrentRoute } from '../../lib/spa/utils/navigate-to';
import { normalizeError } from '../../utils/error/normalize-error';
import { escapeAttr, escapeHtml } from '../../utils/escape-html';
import { truncateText } from '../../utils/truncate-text';

import './styles/errorPage.css';

// The page shown when a page fails to render (#109), in the Nebula, refined
// design: what happened in plain words, what to do, and the details folded
// away for a bug report. Plain template strings, so Prettier never splits an
// end tag (#64).

/**
 * A page that failed to render: its address, what failed, and ways on:
 * try again, go back, or the start page.
 */
export const ErrorPage = async ({ error }: PagePropsType) => {
  const e = error === undefined ? null : normalizeError(error);
  const pageUrl = window.location.href;
  const time = new Date().toISOString();
  const stack = truncateText(e?.stack ?? '');
  const reportUrl = buildBugReportUrl({
    title: `${e?.name ?? 'Error'}: ${(e?.message ?? 'Page failed to load').slice(0, 80)}`,
    body: [
      '**Describe the bug**',
      `${window.location.pathname} showed "Something went wrong".`,
      '',
      '**To reproduce**',
      `1. Go to ${pageUrl}`,
      '2. ...',
      '',
      '**Additional context**',
      '...',
      '',
      '---',
      '### Diagnostics (filled in by the site)',
      `- Error: ${e ? `${e.name}: ${e.message}` : 'none given'}`,
      ...(e?.code ? [`- Code: ${e.code}`] : []),
      ...(e?.details ? [`- Details: ${e.details}`] : []),
      `- Time: ${time}`,
      `- URL: ${pageUrl}`,
      `- User agent: ${navigator.userAgent}`,
      ...(stack ? ['', '### Stack trace', '```text', stack, '```'] : []),
      ''
    ].join('\n')
  });
  const row = (term: string, value: string | undefined) =>
    value ? `<dt>${term}</dt><dd>${escapeHtml(value)}</dd>` : '';

  addOnClick('error-retry', () => renderCurrentRoute());
  addOnClick('error-back', () => history.back());

  return `<div class="error-page nebula-page">
  <section class="error-wrap" aria-labelledby="error-title">
    <h1 id="error-title">Something went wrong</h1>
    <p class="error-lede">This page couldn’t be loaded. It isn’t something you did: often it works on a second try. If it doesn’t, npm or the site may be having trouble, so try again in a little while.</p>
    ${e ? `<p class="error-what"><span class="error-label">What failed</span> ${escapeHtml(e.message)}</p>` : ''}
    <div class="error-actions">
      <button type="button" id="error-retry" class="pill-button is-primary">Try again</button>
      ${history.length > 1 ? '<button type="button" id="error-back" class="pill-button">Go back</button>' : ''}
      <a href="/" data-link class="pill-button">Go to the start page</a>
    </div>
    <details class="error-details">
      <summary>Technical details</summary>
      <dl>${row('Error', e?.name)}${row('Message', e?.message ?? 'No details were given.')}${row('Code', e?.code)}${row('Details', e?.details)}${row('Time', time)}${row('Address', pageUrl)}</dl>
      ${stack ? `<pre><code>${escapeHtml(stack)}</code></pre>` : ''}
    </details>
    <p class="error-report">Still broken? <a href="${escapeAttr(reportUrl)}" target="_blank" rel="noopener noreferrer">Report it on GitHub</a>, with these details filled in.</p>
  </section>
</div>`;
};
