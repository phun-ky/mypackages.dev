// Sets the light theme before the page is painted, from the visitor's choice
// or their system setting, so it doesn't flash dark first. A file rather than
// an inline script, so the Content Security Policy needs no 'unsafe-inline'
// for scripts (#38).
if (
  (localStorage.getItem('prefers-color-scheme') &&
    localStorage.getItem('prefers-color-scheme') === 'light') ||
  (!localStorage.getItem('prefers-color-scheme') &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: light)').matches)
) {
  document.querySelector('html').classList.add('theme--light');
}
