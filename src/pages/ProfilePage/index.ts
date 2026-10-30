import { mountEnsuredPackages } from '../../features/profile/ensured-packages';
import { mountNpmSettings } from '../../features/profile/npm-settings/mount';
import { mountPictureSetting } from '../../features/profile/picture-setting';
import { addOnAfterAppRender, addOnClick } from '../../lib/spa';
import type { PagePropsType } from '../../lib/spa/types';
import { signOut } from '../../services/github';
import { escapeHtml } from '../../utils/escape-html';

import './styles/profilePage.css';

// The profile in the Nebula, refined design (#78): the account, the npm
// settings, privacy, the packages to include, tokens, and deleting the
// account. Plain template strings, so Prettier never splits an end tag (#64).

const PRIVACY =
  'https://github.com/phun-ky/mypackages.dev/blob/main/PRIVACY.md';

export type ProfilePagePropsType = PagePropsType;

export const ProfilePage = async (
  props: ProfilePagePropsType,
  signal: AbortSignal
) => {
  const { session } = props;

  if (!session) return '';

  const { user } = session;
  const { user_metadata } = user;
  // GitHub gives a name only if the user has set one
  const name = user_metadata.full_name ?? user_metadata.name ?? null;
  const githubName =
    user_metadata.user_name ?? user_metadata.preferred_username;

  addOnAfterAppRender(async () => {
    const profilePageElement = document.querySelector('.profile-page');

    if (!(profilePageElement instanceof HTMLElement)) return;

    await mountPictureSetting(profilePageElement, session, signal);
    await mountNpmSettings(profilePageElement, signal);
    await mountEnsuredPackages(profilePageElement, signal);
  });
  addOnClick('profile-sign-out', () => signOut());

  return `<div class="account-page profile-page nebula-page">
  <div class="account-wrap">
    <h1>Profile</h1>

    <section class="user-card account-card" aria-labelledby="account-title">
      <h2 id="account-title">Your account</h2>
      <p>Signed in with GitHub as <strong>${escapeHtml(githubName ?? name ?? user.email ?? 'you')}</strong>${name && githubName ? ` (${escapeHtml(name)})` : ''}${user.email ? `, ${escapeHtml(user.email)}` : ''}.</p>
      <div class="account-row"><a class="pill-button" href="/dashboard" data-link>Dashboard</a><button type="button" id="profile-sign-out" class="pill-button">Sign out</button></div>
    </section>

    <section class="user-card account-card" aria-labelledby="npm-title">
      <h2 id="npm-title">npm</h2>
      <p>The dashboard shows the packages this npm user maintains.</p>
      <form class="account-form npm-settings">
        <div class="account-field">
          <label for="npmusername">npm username</label>
          <input type="text" id="npmusername" autocomplete="off" aria-describedby="npmusername-help" />
          <p id="npmusername-help">As on npmjs.com, like <code>phun-ky</code></p>
        </div>
        <div class="account-field">
          <label for="npmemail">npm email</label>
          <input type="email" id="npmemail" autocomplete="email" aria-describedby="npmemail-help" />
          <p id="npmemail-help">The email on your npm account. Optional.</p>
        </div>
        <div class="account-row">
          <button type="submit" class="pill-button is-primary save">Save</button>
          <span class="status" role="status"></span>
        </div>
      </form>
    </section>

    <section class="user-card account-card" aria-labelledby="privacy-title">
      <h2 id="privacy-title">Privacy</h2>
      <form class="account-form picture-setting">
        <div class="account-check">
          <input type="checkbox" id="show-profile-pictures" aria-describedby="show-profile-pictures-help" />
          <div>
            <label for="show-profile-pictures">Show profile pictures</label>
            <p id="show-profile-pictures-help">Shows your picture from GitHub or gravatar.com, and package maintainers' pictures from GitHub. Those services can then see which pages you open. Off, the site shows initials and loads nothing from them.</p>
          </div>
        </div>
        <span class="status" role="status"></span>
      </form>
      <p><a href="${PRIVACY}" target="_blank" rel="noopener noreferrer">What the site stores, and for how long</a></p>
    </section>

    <section class="user-card account-card" aria-labelledby="include-title">
      <h2 id="include-title">Packages to include</h2>
      <p>npm's search can miss a package, like one that was just published or is deprecated. Packages you add here are always on your dashboard and your own user page.</p>
      <form class="account-form ensured-packages">
        <div class="package-entries"></div>
        <div class="input-group horizontal package-entry">
          <input type="text" aria-label="npm package name" placeholder="Package name, like speccer" autocomplete="off" />
          <button type="button" class="pill-button register">Add</button>
          <span class="status" role="status"></span>
        </div>
      </form>
    </section>

    <section class="user-card account-card" aria-labelledby="tokens-title">
      <h2 id="tokens-title">npm tokens</h2>
      <p>With an npm token, the site asks npm as you, so npm limits it less. Tokens are encrypted, only used for your own requests, and you can delete them.</p>
      <div class="account-row"><a class="pill-button" href="/profile/secrets" data-link>Manage npm tokens</a></div>
    </section>

    <section class="user-card account-card" aria-labelledby="delete-title">
      <h2 id="delete-title">Delete your account</h2>
      <p>Email <a href="mailto:security@phun-ky.net">security@phun-ky.net</a> from the address on your GitHub account, and the maintainer deletes it: your settings, the packages you added and your stored tokens. It can't be undone. <a href="${PRIVACY}#deleting-your-data" target="_blank" rel="noopener noreferrer">More about deleting</a></p>
    </section>
  </div>
</div>`;
};
