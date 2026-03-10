import type { PageId } from '/lib/spa/router/routes';
import type { PagePropsType } from '/lib/spa/types';

type PageCtx = { props: PagePropsType; signal: AbortSignal };

export type PageType = (ctx: PageCtx) => Promise<string> | string;

type LoadPage = () => Promise<PageType>;

export const pageLoaders = {
  StartPage: async () => {
    const { StartPage } = await import('/pages/StartPage');

    return ({ props, signal }: PageCtx) => StartPage(props, signal);
  },
  SignInPage: async () => {
    const { SignInPage } = await import('/pages/SignInPage');

    return ({ props }: PageCtx) => SignInPage(props);
  },
  SignUpPage: async () => {
    const { SignUpPage } = await import('/pages/SignUpPage');

    return () => SignUpPage();
  },
  DashboardPage: async () => {
    const { DashboardPage } = await import('/pages/DashboardPage');

    return ({ props, signal }: PageCtx) => DashboardPage(props, signal);
  },
  ProfilePage: async () => {
    const { ProfilePage } = await import('/pages/ProfilePage');

    return ({ props, signal }: PageCtx) => ProfilePage(props, signal);
  },
  SecretsPage: async () => {
    const { SecretsPage } =
      await import('/pages/ProfilePage/subpages/SecretsPage');

    return ({ props, signal }: PageCtx) => SecretsPage(props, signal);
  },
  NewSecretPage: async () => {
    const { NewSecretPage } =
      await import('/pages/ProfilePage/subpages/SecretsPage/subpages/NewSecretPage');

    return ({ props, signal }: PageCtx) => NewSecretPage(props, signal);
  },
  UserPage: async () => {
    const { UserPage } = await import('/pages/UserPage');

    return ({ props, signal }: PageCtx) => UserPage(props, signal);
  },
  UserPackagesPage: async () => {
    const { UserPackagesPage } = await import('/pages/UserPackagesPage');

    return ({ props, signal }: PageCtx) => UserPackagesPage(props, signal);
  },
  PackagePage: async () => {
    const { PackagePage } = await import('/pages/PackagePage');

    return ({ props, signal }: PageCtx) => PackagePage(props, signal);
  },
  AboutPage: async () => {
    const { AboutPage } = await import('/pages/HelpPage/subpages/AboutPage');

    return ({ props, signal }: PageCtx) => AboutPage(props, signal);
  },
  FeedbackPage: async () => {
    const { FeedbackPage } =
      await import('/pages/HelpPage/subpages/FeedbackPage');

    return ({ props, signal }: PageCtx) => FeedbackPage(props, signal);
  },
  PackagesPage: async () => {
    const { PackagesPage } = await import('/pages/PackagesPage');

    return ({ props, signal }: PageCtx) => PackagesPage(props, signal);
  },
  HelpPage: async () => {
    const { HelpPage } = await import('/pages/HelpPage');

    return ({ props, signal }: PageCtx) => HelpPage(props, signal);
  },
  FAQPage: async () => {
    const { FAQPage } = await import('/pages/HelpPage/subpages/FAQPage');

    return ({ props, signal }: PageCtx) => FAQPage(props, signal);
  },
  UsersPage: async () => {
    const { UsersPage } = await import('/pages/UsersPage');

    return ({ props, signal }: PageCtx) => UsersPage(props, signal);
  },
  ErrorPage: async () => {
    const { ErrorPage } = await import('/pages/ErrorPage');

    return ({ props, signal }: PageCtx) => ErrorPage(props, signal);
  },
  PageNotFoundPage: async () => {
    const { PageNotFoundPage } = await import('/pages/PageNotFoundPage');

    return ({ props, signal }: PageCtx) => PageNotFoundPage(props, signal);
  }
} satisfies Record<PageId | 'PageNotFoundPage' | 'ErrorPage', LoadPage>;
