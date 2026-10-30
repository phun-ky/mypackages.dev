import { init } from '../';
import App from '../../../app';
import { router } from '../router';

export const navigateTo = async (url: string) => {
  history.pushState(null, '', url);

  const routeDetails = router();

  await init(App, routeDetails);
};

/** Renders the current page again, without a new history entry. */
export const renderCurrentRoute = async () => {
  await init(App, router());
};
