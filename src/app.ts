import { getOptionsFromHash } from './app/options/get-options-from-hash';
import { callPage } from './app/routing/call-page';
import { createAuthGuard } from './app/routing/create-auth-guard';
import { pageLoaders } from './app/routing/page-loaders';
import { getBreadcrumbsFromRoutes } from './components/page-section/Breadcrumbs/utils/get-breadcrumbs';
import { Footer } from './components/page-section/Footer';
import { Header } from './components/page-section/Header';
import { Main } from './components/page-section/Main';
import { Navigation } from './components/page-section/Navigation';
import { addOnAfterAppRender } from './lib/spa';
import { routes, type PageId } from './lib/spa/router/routes';
import type { PagePropsType } from './lib/spa/types';
import { getParams } from './lib/spa/utils/get-params';
import { supabase } from './services/supabase';

import './styles/app.css';

let _currentAbort: AbortController | null = null;

const html = String.raw;
const App = async (initialProps: Partial<PagePropsType>) => {
  let _pageId: string;
  let _resolvedPageProps = initialProps;

  const { match } = initialProps;
  const options = getOptionsFromHash();
  const { data, error: sessionError } = await supabase.auth.getSession();
  const { session } = data;

  console.log(session, sessionError);

  if (_currentAbort) _currentAbort.abort();

  _currentAbort = new AbortController();

  const { signal } = _currentAbort;

  if (typeof match === 'string') {
    _resolvedPageProps = { ...initialProps, session };
    _pageId = 'ErrorPage';
  } else {
    if (match) {
      const { route } = match;
      const { page } = route;

      if (!page) {
        _pageId = 'ErrorPage';
      } else {
        _pageId = page;
      }

      _resolvedPageProps = { ...getParams(match), session };
    } else {
      _pageId = 'ErrorPage';
    }
  }

  globalThis.activeElement = document.activeElement;

  const resolvedProps: PagePropsType = { ..._resolvedPageProps, options };
  const load = pageLoaders[_pageId as PageId] ?? pageLoaders.PageNotFoundPage;
  const page = await load();
  const content = await callPage(page, { props: resolvedProps, signal });
  const isAuthed = Boolean(session);

  addOnAfterAppRender(createAuthGuard({ match, session }));

  const crumbs =
    typeof match === 'string'
      ? []
      : getBreadcrumbsFromRoutes({
          routes,
          match,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          params: _resolvedPageProps as any,
          isAuthed,
          withMenus: true
        });

  return html`${await Header({ page: _pageId, ..._resolvedPageProps, crumbs })}
  ${Navigation({
    page: _pageId,
    ...(_resolvedPageProps as unknown as { username?: string })
  })}
  ${Main({ page: _pageId, children: content })} ${Footer({ page: _pageId })}`;
};

export default App;
