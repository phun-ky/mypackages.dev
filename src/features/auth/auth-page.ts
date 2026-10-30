import './styles/auth.css';

// Sign in and sign up in the Nebula, refined design (#78): both continue
// with GitHub, so one layout with its own heading and words. Plain template
// strings, so Prettier never splits an end tag (#64).

const PRIVACY =
  'https://github.com/phun-ky/mypackages.dev/blob/main/PRIVACY.md';
const GITHUB_ICON =
  '<svg viewBox="0 0 98 96" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/></svg>';
// What the dashboard shows, drawn in the theme's colours: an illustration,
// not data, so it has no numbers (it replaces a screenshot of the dark theme)
const PREVIEW = `<aside class="auth-preview" aria-hidden="true">
  <div class="user-card auth-preview-card">
    <p class="auth-preview-label">Downloads per month</p>
    <svg class="auth-preview-chart" viewBox="0 0 360 120" preserveAspectRatio="none"><path class="auth-preview-area" d="M0 96 L33 90 L65 92 L98 80 L131 83 L164 70 L196 74 L229 58 L262 61 L295 44 L327 40 L360 26 L360 120 L0 120 Z"/><path class="auth-preview-line" d="M0 96 L33 90 L65 92 L98 80 L131 83 L164 70 L196 74 L229 58 L262 61 L295 44 L327 40 L360 26"/></svg>
  </div>
  <div class="user-card auth-preview-card">
    <p class="auth-preview-label">Package health</p>
    <div class="auth-preview-health">
      <svg class="auth-preview-ring" viewBox="0 0 120 120"><circle cx="60" cy="60" r="48"/><circle class="auth-preview-ring-value" cx="60" cy="60" r="48" pathLength="100" stroke-dasharray="82 100" transform="rotate(-90 60 60)"/></svg>
      <ul>${[
        ['Security', 92],
        ['Maintenance', 78],
        ['Quality', 86],
        ['Popularity', 60]
      ]
        .map(
          ([name, share]) =>
            `<li><span>${name}</span><i><b style="width:${share}%"></b></i></li>`
        )
        .join('')}</ul>
    </div>
  </div>
</aside>`;

export const AuthPage = ({ mode }: { mode: 'signin' | 'signup' }) => {
  const signIn = mode === 'signin';

  return `<div class="auth-page nebula-page">
  <section class="auth-card user-card" aria-labelledby="auth-title">
    <h1 id="auth-title">${signIn ? 'Welcome back' : 'Create your account'}</h1>
    <p class="auth-lede">${
      signIn
        ? 'Sign in to see your dashboard, the packages you’ve added and your npm tokens.'
        : 'Your account is made the first time you continue with GitHub. Every public page works without one.'
    }</p>
    <button type="button" id="signin" class="pill-button is-primary auth-github">${GITHUB_ICON}Continue with GitHub</button>
    <ul class="auth-gets">
      <li>A dashboard of the packages you maintain</li>
      <li>Packages you add, beyond what npm’s search finds</li>
      <li>An npm token, so npm limits the site less</li>
    </ul>
    <p class="auth-switch">${
      signIn
        ? 'New here? <a href="/dashboard/signup" data-link>Create an account</a>'
        : 'Have an account? <a href="/dashboard/signin" data-link>Sign in</a>'
    }</p>
    <p class="auth-privacy">Signing in uses your GitHub account. <a href="${PRIVACY}" target="_blank" rel="noopener noreferrer">What the site stores</a></p>
  </section>
  ${PREVIEW}
</div>`;
};
