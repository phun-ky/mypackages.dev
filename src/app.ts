import { getOptionsFromHash } from './app/options/get-options-from-hash';
import { applyPageMeta } from './app/routing/apply-page-meta';
import { callPage } from './app/routing/call-page';
import {
  createAuthGuard,
  requiresSignIn
} from './app/routing/create-auth-guard';
import { NEBULA_PAGES } from './app/routing/nebula-pages';
import { pageLoaders } from './app/routing/page-loaders';
import { pageMeta } from './app/routing/page-meta';
import { createReturnAfterSignIn } from './app/routing/return-after-sign-in';
import { Link } from './components/actions/Link';
import { Alert } from './components/feedback/Alert';
import { getBreadcrumbsFromRoutes } from './components/page-section/Breadcrumbs/utils/get-breadcrumbs';
import { Footer } from './components/page-section/Footer';
import { Header } from './components/page-section/Header';
import { Main } from './components/page-section/Main';
import { Navigation } from './components/page-section/Navigation';
import {
  SiteHeader,
  type SiteHeaderPropsType
} from './components/page-section/SiteHeader';
import { addOnAfterAppRender, addOnClick } from './lib/spa';
import { routes, type PageId } from './lib/spa/router/routes';
import type { PagePropsType } from './lib/spa/types';
import { getParams } from './lib/spa/utils/get-params';
import { isReloadingForNewBuild } from './lib/spa/utils/reload-on-new-build';
import { supabase } from './services/supabase';

import './styles/app.css';

let _currentAbort: AbortController | null = null;

const html = String.raw;
// The redesigned pages' header, outside <main> so it's the banner landmark
// (#116), with the section each page belongs to marked
const SITE_HEADER: Partial<
  Record<string, Omit<SiteHeaderPropsType, 'session'>>
> = {
  StartPage: { onStartPage: true },
  PackagesPage: { current: 'packages' },
  PackagePage: { current: 'packages' },
  UsersPage: { current: 'users' },
  UserPage: { current: 'users' },
  UserPackagesPage: { current: 'users' },
  AboutPage: { current: 'about' }
};
const App = async (initialProps: Partial<PagePropsType>) => {
  let _pageId: string;
  let _resolvedPageProps = initialProps;

  const { match } = initialProps;

  // The title, description and link preview tags for this page (#40)
  try {
    applyPageMeta(pageMeta(decodeURI(window.location.pathname)));
  } catch {
    applyPageMeta(pageMeta('/404'));
  }

  const options = getOptionsFromHash();
  const { data } = await supabase.auth.getSession();
  const { session } = data;

  if (_currentAbort) _currentAbort.abort();

  _currentAbort = new AbortController();

  const { signal } = _currentAbort;

  if (typeof match === 'string') {
    _resolvedPageProps = { ...initialProps, session };
    // Rendered by the router when a page fails
    _pageId = match === 'PageNotFoundPage' ? 'PageNotFoundPage' : 'ErrorPage';
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
  const loadPage = async () => {
    try {
      return await load();
    } catch (error) {
      // Once a reload for a new build has started, Vite gives the import
      // nothing, so wait for the reload instead of rendering (#89)
      if (isReloadingForNewBuild()) return new Promise<never>(() => {});

      throw error;
    }
  };
  // Private pages fail without a session, so leave them out and let the auth
  // guard redirect to sign in
  const content = requiresSignIn({ match, session })
    ? ''
    : await callPage(await loadPage(), { props: resolvedProps, signal });
  const isAuthed = Boolean(session);

  addOnAfterAppRender(createAuthGuard({ match, session }));
  addOnAfterAppRender(createReturnAfterSignIn({ session }));

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

  // Keyboard users skip the header and navigation (#44). Focused in a
  // handler: following `#main` would replace the options in the hash
  addOnClick('skip-link', (e) => {
    e.preventDefault();
    document.getElementById('main')?.focus();
  });

  return html`<a class="skip-link" id="skip-link" href="#main"
      >Skip to content</a
    >${
      !NEBULA_PAGES.has(_pageId)
        ? Alert({
            className: 'global-alert',
            label: 'Project status',
            title: 'This project is currently in Alpha!',
            size: 'wide',
            description: html`Expect issues, and if you encounter them,
            ${Link({
              to: 'https://github.com/phun-ky/mypackages.dev/issues',
              children: 'please report it.'
            })}`,

            type: 'important'
          })
        : ''
    }${await Header({ page: _pageId, ..._resolvedPageProps, crumbs })}
    ${Navigation({
      page: _pageId,
      ...(_resolvedPageProps as unknown as { username?: string })
    })}
    ${NEBULA_PAGES.has(_pageId) ? SiteHeader({ session, ...SITE_HEADER[_pageId] }) : ''}
    ${Main({ page: _pageId, children: content })} ${Footer({ page: _pageId })}`;
};

export default App;
