import { ToggleBox } from '../../../components/input-fields/ToggleBox';
import { isConfigKey } from '/config';
import { addOnChange, addOnClick } from '../../../lib/spa';
import type { ComponentBasePropsType } from '../../../lib/spa/types';
import type { Config } from '../../../types';
import { setOptions } from '../../../utils/set-options';

import { clearDashboardCache } from './utils/clear-dashboard-cache';

import './styles/settings.css';

const html = String.raw;

export type SettingsPropsType = ComponentBasePropsType & {
  options: Config;
};

export const Settings = (props: SettingsPropsType) => {
  const { options } = props;

  addOnClick('clear-cache', clearDashboardCache);

  addOnChange('.settings-controls input[type="checkbox"]', (e: Event) => {
    const targetElement = e.target;

    if (!(targetElement instanceof HTMLInputElement)) return;

    if (!isConfigKey(targetElement.id, options)) return; // ignore unknown ids

    options.maintainer = targetElement.checked;
    setOptions({ ...options });
  });

  return html`<div class="settings">
    <button type="button" id="clear-cache" class="button">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 -960 960 960"
      >
        <path
          d="M597.69-250v-60h140v60zm0-320v-60h260v60zm0 160v-60h220v60zM142.31-640h-40v-60h154.61v-47.69h130.77V-700h154.62v60h-40v347.69q0 30.31-21 51.31T430-220H214.62q-30.31 0-51.31-21t-21-51.31z"
        />
      </svg>
      Clear cache
    </button>
    <form class="settings-controls" onsubmit="javascript:return false;">
      <div class="toggle-controls">
        Author or Maintainer?
        ${ToggleBox({
          checked: options.maintainer,
          name: 'role-toggle',
          id: 'maintainer',
          label: options.maintainer ? 'Maintainer' : 'Author'
        })}
      </div>
    </form>
  </div>`;
};
