import { escapeAttr } from '../../../../utils/escape-html';
import { buildFeedbackReportUrl } from '/features/bugs/build-github-issue-url';

import '../../styles/helpPage.css';

export const FeedbackPage = async () => {
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

Anything else we should know (workarounds, frequency, impact, etc.).
`;
  const feedbackUrl = buildFeedbackReportUrl({
    title: issueTitle,
    body: issueBody
  });

  return `<div class="help-page feedback-page nebula-page">
  <div class="help-wrap">
    <div class="help-hero">
      <span class="help-eyebrow">Feedback</span>
      <h1>Have feedback?</h1>
      <p class="help-lede">If something is missing, unclear or wrong, tell me on GitHub. A bug has its own report, and a security problem goes privately, as the <a href="https://github.com/phun-ky/mypackages.dev/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer">security policy</a> says.</p>
      <div class="help-row">
        <a class="pill-button is-primary" href="${escapeAttr(feedbackUrl)}" target="_blank" rel="noopener noreferrer">Give feedback on GitHub</a>
        <a class="pill-button" href="https://github.com/phun-ky/mypackages.dev/issues/new?template=bug_report.md" target="_blank" rel="noopener noreferrer">Report a bug</a>
        <a class="pill-button" href="/help" data-link>Back to Help</a>
      </div>
    </div>
  </div>
</div>`;
};
