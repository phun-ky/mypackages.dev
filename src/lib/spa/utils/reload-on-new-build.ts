const KEY = 'reloaded-for-new-build';
// Long enough for a reload to finish, short enough that a later deploy in the
// same tab still gets its own reload
const WINDOW_MS = 10_000;

// Set when this page has started reloading
let reloading = false;

/**
 * Reloads the page once when a page file can't be loaded, which happens to a
 * tab that was open during a deploy: GitHub Pages replaces the whole site, so
 * the files of the previous build are gone (#82). The reload gets the new
 * build, at the URL the visitor was going to.
 *
 * If the page was already reloaded for this a moment ago, the error goes
 * through, so a file that is really missing shows the error page instead of
 * reloading forever.
 *
 * @see https://vite.dev/guide/build#load-error-handling
 */
export const reloadOnNewBuild = (event: Event) => {
  // The page is going away already. Browsers abort the files it was still
  // loading, like stylesheets, which fails them too.
  if (reloading) {
    event.preventDefault();

    return;
  }

  let last: number;

  try {
    last = Number(sessionStorage.getItem(KEY)) || 0;
  } catch {
    // Without sessionStorage there is no way to tell a second failure from
    // the first, so let the error through rather than risk a loop
    return;
  }

  if (Date.now() - last < WINDOW_MS) return;

  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    return;
  }

  reloading = true;
  event.preventDefault();
  window.location.reload();
};
