import { addOnAfterAppRender } from '../../../lib/spa';
import { supabase } from '../../../services/supabase';
import { escapeAttr, escapeHtml } from '../../../utils/escape-html';
import './styles/frontpageSearchStatistics.css';

const html = String.raw;

type Lookup = {
  kind: 'package' | 'user';
  term?: string;
  package_name?: string;
  username?: string;
};

const USER_ICON =
  '<svg class="lookup-icon" viewBox="0 -960 960 960" aria-hidden="true"><path d="M480-492.31q-57.75 0-98.87-41.12Q340-574.56 340-632.31t41.13-98.87q41.12-41.13 98.87-41.13t98.87 41.13Q620-690.06 620-632.31t-41.13 98.88q-41.12 41.12-98.87 41.12M180-187.69v-88.93q0-29.38 15.96-54.42t42.66-38.5q59.3-29.07 119.65-43.61T480-427.69t121.73 14.54 119.65 43.61q26.7 13.46 42.66 38.5T780-276.62v88.93z"/></svg>';
const PACKAGE_ICON =
  '<svg class="lookup-icon" viewBox="0 -960 960 960" aria-hidden="true"><path d="M450-177.23v-285.54L200-607.54v278.62q0 3.07 1.54 5.77 1.54 2.69 4.61 4.61zm60 0 243.85-141.31q3.07-1.92 4.61-4.61 1.54-2.7 1.54-5.77v-278.62L510-462.77zm-66.15 65.46L176.16-265.85q-17.08-9.84-26.62-26.3-9.54-16.47-9.54-36.16v-303.38q0-19.69 9.54-36.16 9.54-16.46 26.62-26.3l267.69-154.08q17.07-9.85 36.15-9.85t36.15 9.85l267.69 154.08q17.08 9.84 26.62 26.3 9.54 16.47 9.54 36.16v303.38q0 19.69-9.54 36.16-9.54 16.46-26.62 26.3L516.15-111.77q-17.07 9.85-36.15 9.85t-36.15-9.85M634.23-604 727-657.23 486.15-796.54q-3.07-1.92-6.15-1.92t-6.15 1.92l-86.85 50zM480-514.46l93-53.85-247-142.77-93 53.85z"/></svg>';
/** One chip per lookup, linking to the package or user page. */
const chips = (lookups: Lookup[] | null) => {
  if (!lookups?.length) return html`<li class="is-empty">Nothing yet</li>`;

  return lookups
    .map((lookup) => {
      const isUser = lookup.kind === 'user';
      const term = isUser
        ? (lookup.username ?? lookup.term)
        : (lookup.package_name ?? lookup.term);

      if (!term) return '';

      const href = `/${isUser ? 'users' : 'packages'}/${escapeAttr(term)}`;

      // One line: diff-dom misreads end tags split over lines (#64)
      return `<li><a href="${href}" data-link class="${isUser ? 'is-user' : 'is-package'}">${isUser ? USER_ICON : PACKAGE_ICON}${escapeHtml(term)}</a></li>`;
    })
    .join('');
};
const fill = (id: string, query: () => PromiseLike<{ data: unknown }>) =>
  addOnAfterAppRender(async () => {
    const element = document.getElementById(id);

    if (!element) return;

    const { data } = await query();

    element.innerHTML = chips(data as Lookup[] | null);
  });

/**
 * What people look up: trending in the last 24 hours, the latest, and the
 * most popular by unique people. Package names and npm usernames only (see
 * log_search_event).
 */
export const FrontpageSearchStatistics = async () => {
  fill('trending-searches', () =>
    supabase.from('trending_lookups_24h').select('*').limit(8)
  );
  fill('latest-searches', () =>
    supabase.from('latest_unique_lookups').select('*').limit(8)
  );
  fill('popular-searches', () =>
    supabase.from('popular_lookups_unique_people').select('*').limit(8)
  );

  return html`<div class="frontpage-search-statistics">
    <div class="lookup-box">
      <h3>Trending</h3>
      <ul id="trending-searches" class="lookup-chips" aria-live="polite"></ul>
    </div>
    <div class="lookup-box">
      <h3>Latest</h3>
      <ul id="latest-searches" class="lookup-chips" aria-live="polite"></ul>
    </div>
    <div class="lookup-box">
      <h3>Most popular</h3>
      <ul id="popular-searches" class="lookup-chips" aria-live="polite"></ul>
    </div>
  </div>`;
};
