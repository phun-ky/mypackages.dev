import { Link } from '../../../../components/actions/Link';
import { Container } from '../../../../components/layout/Container';
import type { PagePropsType } from '../../../../lib/spa/types';
import { buildFeedbackReportUrl } from '/features/bugs/build-github-issue-url';

import './styles/feedbackPage.css';

const html = String.raw;

export const FeedbackPage = async (
  props: PagePropsType,
  signal: AbortSignal
) => {
  console.log(props, signal);

  const issueTitle = 'Feedback';
  const issueBody = `Thanks for taking the time to share feedback! 🙌

Before you submit:

- Check our **About** page
- Check our **Help** page
- Check our **FAQ** page

> If your feedback is actually a **bug**, please use the **Bug report**
> template. If you're proposing a **new capability**, please use the **Feature
> request** template.

---

## What kind of feedback is this?

(Select one)

- [ ] Question / Clarification
- [ ] UX / Usability
- [ ] Documentation
- [ ] Performance
- [ ] Accessibility
- [ ] Other

## What are you trying to achieve?

A clear and concise description of your goal / job-to-be-done.

## Feedback

What worked well? What didn’t? What would you change?

## Target (if applicable)

If this feedback relates to a specific page/route/state, include links:

- URL(s):
  - https://…
  - https://…
- Where on the page / which feature?:
- Account / role / permissions relevant?: (if applicable)

## Expected outcome (optional)

What would “better” look like to you?

## Screenshots / recordings (optional)

Add screenshots or a short recording if it helps explain.

## Environment (if relevant)

- Device: [e.g. Desktop / iPhone 15]
- OS: [e.g. macOS 14 / Windows 11 / iOS 17]
- Browser: [e.g. Chrome / Safari / Firefox]
- Version: [e.g. 121]

## Additional context

short recording if it helps explain.

## Environment (if relevant)

- Device: [e.g. Desktop / iPhone 15]
- OS: [e.g. macOS 14 / Windows 11 / iOS 17]
- Browser: [e.g. Chrome / Safari / Firefox]
- Version: [e.g. 121]

## Additional context

Anything else we should know (workarounds, frequency, impact, etc.).
`;
  const feedbackUrl = buildFeedbackReportUrl({
    title: issueTitle,
    body: issueBody
  });

  return html`<section class="feedback-page">
    <header class="feedback-hero">
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
              <span class="eyebrow">Feedback</span>
              <h1>Have feedback?</h1>
            </div>
            <p class="lead">
              If something is missing, or wrong, please let me know!
            </p>

            <div class="flex gap-1">
              ${Link({
                to: feedbackUrl,
                className: 'button primary',
                children: 'Provide feedback'
              })}
            </div>
          </div>
        `
      })}
    </header>
  </section>`;
};
