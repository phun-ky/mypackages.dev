import { addOnClick } from '../../../lib/spa';
import './styles/themeToggle.css';

const html = String.raw;
// Where index.html looks for the visitor's choice before the page renders
const STORAGE_KEY = 'prefers-color-scheme';
const isLight = () =>
  document.documentElement.classList.contains('theme--light');
const label = (light: boolean) =>
  light ? 'Switch to the dark theme' : 'Switch to the light theme';

/**
 * Switches between the dark and light themes. Until the visitor picks one,
 * the site follows their system (see index.html).
 */
export const ThemeToggle = () => {
  addOnClick('theme-toggle', (_event, toggle) => {
    const light = !isLight();

    document.documentElement.classList.toggle('theme--light', light);

    try {
      localStorage.setItem(STORAGE_KEY, light ? 'light' : 'dark');
    } catch {
      // Without storage, the choice lasts until the page reloads
    }

    toggle.setAttribute('aria-label', label(light));
    toggle.setAttribute('title', label(light));
  });

  const light = isLight();

  // Both icons are drawn; CSS shows the one for the theme you'd switch to
  return html`<button
    type="button"
    id="theme-toggle"
    class="theme-toggle"
    aria-label="${label(light)}"
    title="${label(light)}"
  >
    <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
    <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
      />
    </svg>
  </button>`;
};
