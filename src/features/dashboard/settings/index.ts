import { addOnClick } from '../../../lib/spa';

import { clearDashboardCache } from './utils/clear-dashboard-cache';

import './styles/settings.css';

const html = String.raw;

// The dashboard lists the packages a user maintains; there's no author mode
// to choose (#95)
export const Settings = () => {
  addOnClick('clear-cache', clearDashboardCache);

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
  </div>`;
};
