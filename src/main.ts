// Global events
import { DOMContentLoaded } from './lib/spa/utils/dom-content-loaded';
import { eventAfterAppRender } from './lib/spa/utils/event-after-app-render';
import { popstate } from './lib/spa/utils/popstate';
import { reloadOnNewBuild } from './lib/spa/utils/reload-on-new-build';
import { ttlLocalStorage } from './utils/storage/ttl-local-storage';

// Fonts, served from the site itself instead of Google Fonts. Inter with its
// optical size axis, as before.
import '@fontsource-variable/inter/opsz.css';
import '@fontsource-variable/lexend-deca';
// Styles
import './styles/site.css';

const url = new URL(window.location.href);
const redirectedPath = url.searchParams.get('p');

if (redirectedPath) {
  // Old links, from when 404.html redirected deep links to /?p=<path>
  history.replaceState(null, '', decodeURIComponent(redirectedPath));
} else if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
  // GitHub Pages redirects a page that is also a directory, like /help, to
  // /help/ (#39); the routes have no trailing slash
  history.replaceState(
    null,
    '',
    url.pathname.replace(/\/+$/, '') + url.search + url.hash
  );
}

// Expired and oversized cache entries, and keys older builds left (#112)
ttlLocalStorage.sweep();

// A page file from an older build is gone after a deploy
window.addEventListener('vite:preloadError', reloadOnNewBuild);
// Events that happens on URL change in our SPA
window.addEventListener('popstate', popstate);
// window.addEventListener('hashchange', popstate);
// Events that happens after DOM is loaded
document.addEventListener('DOMContentLoaded', DOMContentLoaded);
// Events that happens after every App render
document.addEventListener('eventAfterAppRender', eventAfterAppRender);
// Forms the app handles itself, on keydown and click: submitting one would
// reload the page. An inline onsubmit would need 'unsafe-inline' (#38).
document.addEventListener('submit', (event) => {
  if ((event.target as Element).matches('form[data-no-submit]')) {
    event.preventDefault();
  }
});
