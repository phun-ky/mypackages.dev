import { addOnClick, addOnInput } from '../../lib/spa';
import type { Config } from '../../types';
import { setOptions } from '../../utils/set-options';
import { clearDashboardCache } from '../dashboard/settings/utils/clear-dashboard-cache';

// Which view of the packages a visitor last picked, for this browser
const VIEW_KEY = 'user-page:view';

export type PackagesView = 'scope' | 'table';

export const getStoredView = (): PackagesView => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'table' ? 'table' : 'scope';
  } catch {
    return 'scope';
  }
};

const showView = (view: PackagesView) => {
  document
    .getElementById('packages-by-scope')
    ?.toggleAttribute('hidden', view !== 'scope');
  document
    .getElementById('packages-table')
    ?.toggleAttribute('hidden', view !== 'table');
  document
    .getElementById('view-scope')
    ?.setAttribute('aria-pressed', String(view === 'scope'));
  document
    .getElementById('view-table')
    ?.setAttribute('aria-pressed', String(view === 'table'));

  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch {
    // The choice lasts until the page reloads
  }
};
const rows = () =>
  Array.from(
    document.querySelectorAll<HTMLTableRowElement>('#package-rows tr')
  );
/** Shows the rows that match the filter text and the pressed chip. */
const applyFilter = () => {
  const input = document.getElementById('package-filter');
  const text =
    input instanceof HTMLInputElement ? input.value.trim().toLowerCase() : '';
  const chip = document.querySelector<HTMLElement>(
    '.filter-chip[aria-pressed="true"]'
  );
  const filter = chip?.dataset.filter ?? 'all';

  let shown = 0;

  for (const row of rows()) {
    const { name = '', keywords = '', state = '' } = row.dataset;
    const matches =
      (!text || name.includes(text) || keywords.includes(text)) &&
      (filter === 'all' || state.split(' ').includes(filter));

    row.hidden = !matches;
    shown += matches ? 1 : 0;
  }

  const count = document.getElementById('package-count');

  if (count) count.textContent = String(shown);
};
const sortRows = (key: string) => {
  const body = document.getElementById('package-rows');
  const header = document
    .querySelector(`.sort-button[data-sort="${key}"]`)
    ?.closest('th');

  if (!body || !header) return;

  // Names go A to Z first, numbers from the highest; a second click flips it
  const first = key === 'name' ? 'ascending' : 'descending';
  const direction =
    header.getAttribute('aria-sort') === first
      ? first === 'ascending'
        ? 'descending'
        : 'ascending'
      : first;
  const sign = direction === 'ascending' ? 1 : -1;
  const value = (row: HTMLTableRowElement) => row.dataset[key] ?? '';
  const sorted = rows().sort((a, b) => {
    if (key === 'name') return sign * value(a).localeCompare(value(b));

    // Rows without a value, like a new package's change, go last
    const x = value(a) === '' ? -Infinity : Number(value(a));
    const y = value(b) === '' ? -Infinity : Number(value(b));

    return sign * (x - y) || value(a).localeCompare(value(b));
  });

  for (const th of document.querySelectorAll('.pkg-table th[aria-sort]')) {
    th.removeAttribute('aria-sort');
  }

  header.setAttribute('aria-sort', direction);
  body.append(...sorted);
};

/** Wires the controls on the user page, for one render. */
export const attachUserPageEvents = (options: Config) => {
  addOnClick('view-scope', () => showView('scope'));
  addOnClick('view-table', () => showView('table'));
  addOnClick('role-maintainer', () =>
    setOptions({ ...options, maintainer: true })
  );
  addOnClick('role-author', () =>
    setOptions({ ...options, maintainer: false })
  );
  addOnClick('refresh-data', () => {
    clearDashboardCache();
    window.location.reload();
  });
  addOnInput('package-filter', applyFilter);
  addOnClick('.filter-chip', (_event, pressed) => {
    for (const chip of document.querySelectorAll('.filter-chip')) {
      chip.setAttribute('aria-pressed', String(chip === pressed));
    }

    applyFilter();
  });
  addOnClick('.sort-button', (_event, button) => {
    const key = (button as HTMLElement).dataset.sort;

    if (key) sortRows(key);
  });
};
