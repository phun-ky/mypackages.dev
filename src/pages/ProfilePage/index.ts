import { Button } from '../../components/actions/Button';
import { Alert } from '../../components/feedback/Alert';
import { Checkbox } from '../../components/input-fields/Checkbox';
import { Label } from '../../components/input-fields/Label';
import { Container } from '../../components/layout/Container';
import { mountEnsuredPackages } from '../../features/profile/ensured-packages';
import { mountNpmSettings } from '../../features/profile/npm-settings/mount';
import { addOnAfterAppRender } from '../../lib/spa';
import type { PagePropsType } from '../../lib/spa/types';

import './styles/profilePage.css';

const html = String.raw;

export type ProfilePagePropsType = PagePropsType;

export const ProfilePage = async (
  props: ProfilePagePropsType,
  signal: AbortSignal
) => {
  const { session } = props;

  if (!session) return '';

  const { user } = session;
  const { user_metadata } = user;
  const { full_name, email } = user_metadata;

  addOnAfterAppRender(async () => {
    const profilePageElement = document.querySelector('.profile-page');

    if (!(profilePageElement instanceof HTMLElement)) return;

    await mountNpmSettings(profilePageElement, signal);
    await mountEnsuredPackages(profilePageElement, signal);
  });

  return html`<section class="profile-page">
    ${Container({ size: 'small', children: html`<h1>Profile</h1>` })}
    ${Container({
      size: 'small',
      children: html`<h2>Preferences</h2>
        <p>Manage your profile and dashboard experience.</p>
        <form class="well">
          <div class="input-group horizontal">
            <div class="label-container">
              <label for="full_name">Full name</label>
            </div>
            <div class="input-container">
              <input type="text" id="full_name" disabled value="${full_name}" />
            </div>
          </div>

          <div class="input-group horizontal">
            <div class="label-container">
              <label for="email">Last name</label>
            </div>
            <div class="input-container">
              <input type="email" id="email" disabled value="${email}" />
            </div>
          </div>
          <div class="input-group horizontal">
            ${Button({
              className: 'primary save',
              disabled: true,
              children: html`Save`
            })}
          </div>
        </form>`
    })}
    ${Container({
      size: 'small',
      children: html`<h2>Npm</h2>
        <p>Manage your npm settings.</p>
        <form class="well npm-settings">
          <div class="input-group horizontal">
            <div class="label-container">
              <label for="npmusername">Npm Username</label>
              <p>The username you are associated with at npm</p>
            </div>
            <div class="input-container">
              <input type="text" id="npmusername" />
            </div>
          </div>
          <div class="input-group horizontal">
            <div class="label-container">
              <label for="npmemail">Npm email</label>
              <p>The email you are associated with at npm</p>
            </div>
            <div class="input-container">
              <input type="text" id="npmemail" />
            </div>
          </div>
          <div class="input-group horizontal">
            <div class="label-container">
              Lookup packages where user is maintainer?

              <p>
                Should we look for packages where the user is the author or the
                maintainer? When toggled, we check for packages where the user
                is a maintainer.
              </p>
            </div>
            <div class="input-container">
              ${Checkbox({
                name: 'role-toggle',
                id: 'author-maintainer',
                className: 'toggle '
              })}
              ${Label({
                labelFor: 'author-maintainer',
                label: 'Author or maintainer?'
              })}
            </div>
          </div>

          <div class="input-group horizontal">
            ${Alert({
              title: 'Issues with package lookup',
              description: html`<p>
                Ever since GitHub and npmjs started to use Trusted Publishing,
                there are some discrepancies when looking up packages by author
                and maintainer. With this option, you can toggle between them
                when looking up user packages to find the best fit.
              </p>`,
              type: 'important'
            })}
          </div>

          <div class="input-group horizontal">
            <div class="label-container">
              <label for="npm-query-size">Query size</label>
              <p>
                The number of results when querying npm registry. Default is 50,
                max is 250.
              </p>
            </div>
            <div class="input-container">
              <input type="number" min="0" max="250" id="npm-query-size" />
            </div>
          </div>

          <div class="input-group horizontal">
            <span class="status"></span>
            ${Button({
              className: 'primary save',
              type: 'submit',
              children: html`Save`
            })}
          </div>
        </form>
        <h3>Ensured Packages</h3>
        <p>Add packages to ensure that they appear in your dashboard</p>
        <form class="well ensured-packages">
          <div class="package-entries"></div>
          <div class="input-group horizontal package-entry">
            <input type="text" />
            ${Button({ children: html`Register`, className: 'register' })}
            <span class="status"></span>
          </div>

          <div class="input-group horizontal">
            ${Alert({
              title: 'Perfect for deprecated packages',
              description: html`<p>
                Deprecated packages will not appear in npm's search results. But
                they do exist in the registry. By adding these packages here,
                you can still track them in your dashboard.
              </p>`,
              type: 'note'
            })}
          </div>
        </form> `
    })}
    ${Container({
      size: 'small',
      children: html`<h2>Danger zone</h2>
        <p>Permanently delete your account.</p>
        ${Alert({
          title: 'Request for account deletion',
          description: html`<p>
              Deleting your account is permanent and cannot be undone. Your data
              will be deleted within 30 days, but we may retain some metadata
              and logs for longer where required or permitted by law.
            </p>
            ${Button({
              children: 'Request for account deletion',
              className: 'danger'
            })}`,
          type: 'caution'
        })}`
    })}
  </section>`;
};
