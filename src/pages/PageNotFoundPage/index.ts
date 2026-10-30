import { escapeHtml } from '../../utils/escape-html';

import '../ErrorPage/styles/errorPage.css';

// The page for an address the site doesn't have, in the Nebula, refined
// design, like the error page (#109)

// A malformed address, like /%E0%A4%A, can't be decoded: shown as it is
const address = () => {
  try {
    return decodeURI(window.location.pathname);
  } catch {
    return window.location.pathname;
  }
};

export const PageNotFoundPage = async () =>
  `<div class="error-page nebula-page">
  <section class="error-wrap" aria-labelledby="error-title">
    <h1 id="error-title">Page not found</h1>
    <p class="error-lede">There’s nothing at this address. The page may have moved, or the address may have a typo: <code>${escapeHtml(address())}</code></p>
    <div class="error-actions">
      <a href="/" data-link class="pill-button is-primary">Go to the start page</a>
      <a href="/packages" data-link class="pill-button">Look up a package</a>
      <a href="/users" data-link class="pill-button">Look up a user</a>
    </div>
  </section>
</div>`;
