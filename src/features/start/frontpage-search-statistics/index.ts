import { Card } from '../../../components/content/Card';
import { addOnAfterAppRender } from '../../../lib/spa';
import { supabase } from '../../../services/supabase';
import './styles/frontpageSearchStatistics.css';

const html = String.raw;

export const FrontpageSearchStatistics = async () => {
  addOnAfterAppRender(async () => {
    const latestSearchesElement = document.getElementById('latest-searches');

    if (!latestSearchesElement) return;

    const { data: latest } = await supabase
      .from('latest_unique_lookups')
      .select('*')
      .limit(5);
    const htmlString = Card({
      children: html`${latest
        ?.map((entry) => {
          const { kind, username, package_name } = entry;

          if (kind === 'user')
            return html`<a href="/users/${username}" data-link>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="var(--color-brand)"
                viewBox="0 -960 960 960"
              >
                <path
                  d="M480-492.31q-57.75 0-98.87-41.12Q340-574.56 340-632.31t41.13-98.87q41.12-41.13 98.87-41.13t98.87 41.13Q620-690.06 620-632.31t-41.13 98.88q-41.12 41.12-98.87 41.12M180-187.69v-88.93q0-29.38 15.96-54.42t42.66-38.5q59.3-29.07 119.65-43.61T480-427.69t121.73 14.54 119.65 43.61q26.7 13.46 42.66 38.5T780-276.62v88.93z"
                />
              </svg>
              ${username}
            </a>`;

          return html`<a href="/packages/${package_name}" data-link>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="#10b981"
              viewBox="0 -960 960 960"
            >
              <path
                d="M450-177.23v-285.54L200-607.54v278.62q0 3.07 1.54 5.77 1.54 2.69 4.61 4.61zm60 0 243.85-141.31q3.07-1.92 4.61-4.61 1.54-2.7 1.54-5.77v-278.62L510-462.77zm-66.15 65.46L176.16-265.85q-17.08-9.84-26.62-26.3-9.54-16.47-9.54-36.16v-303.38q0-19.69 9.54-36.16 9.54-16.46 26.62-26.3l267.69-154.08q17.07-9.85 36.15-9.85t36.15 9.85l267.69 154.08q17.08 9.84 26.62 26.3 9.54 16.47 9.54 36.16v303.38q0 19.69-9.54 36.16-9.54 16.46-26.62 26.3L516.15-111.77q-17.07 9.85-36.15 9.85t-36.15-9.85M634.23-604 727-657.23 486.15-796.54q-3.07-1.92-6.15-1.92t-6.15 1.92l-86.85 50zM480-514.46l93-53.85-247-142.77-93 53.85z"
              />
            </svg>
            ${package_name}
          </a>`;
        })
        .join('\n')}`
    });

    latestSearchesElement.innerHTML = htmlString;
  });

  addOnAfterAppRender(async () => {
    const trendingSearchesElement =
      document.getElementById('trending-searches');

    if (!trendingSearchesElement) return;

    const { data: trending } = await supabase
      .from('trending_lookups_24h')
      .select('*');
    const htmlString = Card({
      children: html`${trending
        ?.map((entry) => {
          const { kind, term } = entry;

          if (kind === 'user')
            return html`<a href="/users/${term}" data-link>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="var(--color-brand)"
                viewBox="0 -960 960 960"
              >
                <path
                  d="M480-492.31q-57.75 0-98.87-41.12Q340-574.56 340-632.31t41.13-98.87q41.12-41.13 98.87-41.13t98.87 41.13Q620-690.06 620-632.31t-41.13 98.88q-41.12 41.12-98.87 41.12M180-187.69v-88.93q0-29.38 15.96-54.42t42.66-38.5q59.3-29.07 119.65-43.61T480-427.69t121.73 14.54 119.65 43.61q26.7 13.46 42.66 38.5T780-276.62v88.93z"
                />
              </svg>
              ${term}
            </a>`;

          return html`<a href="/packages/${term}" data-link>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="#10b981"
              viewBox="0 -960 960 960"
            >
              <path
                d="M450-177.23v-285.54L200-607.54v278.62q0 3.07 1.54 5.77 1.54 2.69 4.61 4.61zm60 0 243.85-141.31q3.07-1.92 4.61-4.61 1.54-2.7 1.54-5.77v-278.62L510-462.77zm-66.15 65.46L176.16-265.85q-17.08-9.84-26.62-26.3-9.54-16.47-9.54-36.16v-303.38q0-19.69 9.54-36.16 9.54-16.46 26.62-26.3l267.69-154.08q17.07-9.85 36.15-9.85t36.15 9.85l267.69 154.08q17.08 9.84 26.62 26.3 9.54 16.47 9.54 36.16v303.38q0 19.69-9.54 36.16-9.54 16.46-26.62 26.3L516.15-111.77q-17.07 9.85-36.15 9.85t-36.15-9.85M634.23-604 727-657.23 486.15-796.54q-3.07-1.92-6.15-1.92t-6.15 1.92l-86.85 50zM480-514.46l93-53.85-247-142.77-93 53.85z"
              />
            </svg>
            ${term}
          </a>`;
        })
        .join('\n')}`
    });

    trendingSearchesElement.innerHTML = htmlString;
  });
  addOnAfterAppRender(async () => {
    const popularSearchesElement = document.getElementById('popular-searches');

    if (!popularSearchesElement) return;

    const { data: popular } = await supabase
      .from('popular_lookups_unique_people')
      .select('*')
      .limit(10);
    const htmlString = Card({
      className: 'column-2',
      children: html`${popular
        ?.map((entry) => {
          const { kind, term } = entry;

          if (kind === 'user')
            return html`<a href="/users/${term}" data-link>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="var(--color-brand)"
                viewBox="0 -960 960 960"
              >
                <path
                  d="M480-492.31q-57.75 0-98.87-41.12Q340-574.56 340-632.31t41.13-98.87q41.12-41.13 98.87-41.13t98.87 41.13Q620-690.06 620-632.31t-41.13 98.88q-41.12 41.12-98.87 41.12M180-187.69v-88.93q0-29.38 15.96-54.42t42.66-38.5q59.3-29.07 119.65-43.61T480-427.69t121.73 14.54 119.65 43.61q26.7 13.46 42.66 38.5T780-276.62v88.93z"
                />
              </svg>
              ${term}
            </a>`;

          return html`<a href="/packages/${term}" data-link>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="#10b981"
              viewBox="0 -960 960 960"
            >
              <path
                d="M450-177.23v-285.54L200-607.54v278.62q0 3.07 1.54 5.77 1.54 2.69 4.61 4.61zm60 0 243.85-141.31q3.07-1.92 4.61-4.61 1.54-2.7 1.54-5.77v-278.62L510-462.77zm-66.15 65.46L176.16-265.85q-17.08-9.84-26.62-26.3-9.54-16.47-9.54-36.16v-303.38q0-19.69 9.54-36.16 9.54-16.46 26.62-26.3l267.69-154.08q17.07-9.85 36.15-9.85t36.15 9.85l267.69 154.08q17.08 9.84 26.62 26.3 9.54 16.47 9.54 36.16v303.38q0 19.69-9.54 36.16-9.54 16.46-26.62 26.3L516.15-111.77q-17.07 9.85-36.15 9.85t-36.15-9.85M634.23-604 727-657.23 486.15-796.54q-3.07-1.92-6.15-1.92t-6.15 1.92l-86.85 50zM480-514.46l93-53.85-247-142.77-93 53.85z"
              />
            </svg>
            ${term}
          </a>`;
        })
        .join('\n')}`
    });

    popularSearchesElement.innerHTML = htmlString;
  });

  return html`<div class="frontpage-search-statistics">
    <div class="search-statistic-box">
      <span class="title"> Trending searches </span>
      <div id="trending-searches"></div>
    </div>
    <div class="search-statistic-box">
      <span class="title"> Latest searches </span>
      <div id="latest-searches"></div>
    </div>
    <div class="search-statistic-box">
      <span class="title"> Popular searches </span>
      <div id="popular-searches"></div>
    </div>
  </div>`;
};
