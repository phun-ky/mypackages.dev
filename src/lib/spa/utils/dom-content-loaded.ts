import { router } from '../router';
import type { NavigateToEvent } from '../types';

import { bootstrap } from './bootstrap';
import { eventMatches } from './event-matches';
import { navigateTo } from './navigate-to';

// When DOM is loaded
export const DOMContentLoaded = async () => {
  // If any navigation is fired through a custom event
  document.addEventListener('navigateTo', (e: NavigateToEvent) => {
    const { to } = e.detail;

    navigateTo(to);
  });
  // If a user clicks a link that should change the popstate, instead of hard routing
  document.body.addEventListener('click', async (e: Event) => {
    const target = e.target;

    if (!(target instanceof Element)) return;

    const linkEl = eventMatches(e, 'a[data-link]') as HTMLAnchorElement;

    if (linkEl) {
      e.preventDefault();
      await navigateTo(linkEl.href);
    }

    const toggleMenuEl = eventMatches(
      e,
      '[data-toggle-menu]'
    ) as HTMLAnchorElement;

    if (toggleMenuEl) {
      e.preventDefault();
      toggleMenuEl.parentElement?.classList.toggle('is-open');
    }
  });

  // Get current route
  const routeDetails = router();

  // Reinitialise the SPA

  await bootstrap(routeDetails);
};
