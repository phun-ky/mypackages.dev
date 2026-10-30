/* eslint-disable @typescript-eslint/no-explicit-any */
import { deleteProviderToken } from '../../../../features/profile/secrets/utils/delete-provider-token';
import { getActiveProviderTokenMeta } from '../../../../features/profile/secrets/utils/get-active-provider-token-meta';
import { listProviderTokens } from '../../../../features/profile/secrets/utils/list-provider-tokens';
import { setActiveProviderToken } from '../../../../features/profile/secrets/utils/set-active-provider-token';
import { addOnAfterAppRender } from '../../../../lib/spa';
import type { PagePropsType } from '../../../../lib/spa/types';
import { supabase } from '../../../../services/supabase';
import { escapeAttr, escapeHtml } from '../../../../utils/escape-html';

import '../../styles/profilePage.css';

export type SecretsPagePropsType = PagePropsType;

export const SecretsPage = async (
  _props: SecretsPagePropsType,
  signal: AbortSignal
) => {
  const items = await listProviderTokens(supabase);
  const activeNpm = await getActiveProviderTokenMeta(
    supabase,
    { provider: 'npm' },
    signal
  );

  addOnAfterAppRender(() => {
    const root = document.querySelector('.secrets-page');

    if (!(root instanceof HTMLElement)) return;

    SecretsPage_bind(root, { signal });
  });

  const rows = items
    .map((item) => {
      const { id, label, provider, updated_at } = item as any;
      const isActive = provider === 'npm' && activeNpm?.token_id === id;
      const name = escapeHtml(label ?? provider);

      return `<tr data-row data-id="${escapeAttr(id)}" data-provider="${escapeAttr(provider)}">
  <td>${name}${isActive ? ' <span class="account-badge" data-active>Active</span>' : ''}</td>
  <td>${escapeHtml(provider)}</td>
  <td>${escapeHtml(new Date(updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))}</td>
  <td><div class="account-row">${
    provider === 'npm' && !isActive
      ? `<button type="button" class="pill-button" data-make-active data-token-id="${escapeAttr(id)}">Use for npm</button>`
      : ''
  }<button type="button" class="pill-button is-danger" data-delete data-token-id="${escapeAttr(id)}" data-label="${escapeAttr(label ?? '')}" aria-label="Delete ${escapeAttr(label ?? provider)}">Delete</button></div></td>
</tr>`;
    })
    .join('');

  return `<div class="account-page secrets-page nebula-page" data-secrets-page>
  <div class="account-wrap">
    <h1>npm tokens</h1>
    <section class="user-card account-card" aria-labelledby="tokens-title">
      <h2 id="tokens-title">Your tokens</h2>
      <p>The active npm token is the one the site uses to ask npm as you. Deleting a token deletes it from the database.</p>
      ${
        items.length
          ? `<table class="account-table"><caption class="visually-hidden">Your stored tokens</caption><thead><tr><th scope="col">Label</th><th scope="col">Provider</th><th scope="col">Updated</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead><tbody>${rows}</tbody></table>`
          : "<p>You haven't stored a token yet.</p>"
      }
      <div class="account-row"><a class="pill-button is-primary" href="/profile/secrets/new" data-link>Add a token</a><a class="pill-button" href="/profile" data-link>Back to your profile</a></div>
      <div class="status" aria-live="polite" data-status></div>
    </section>
  </div>
</div>`;
};

export const SecretsPage_bind = (
  root: HTMLElement,
  opts: { signal?: AbortSignal }
) => {
  const status = root.querySelector<HTMLElement>('[data-status]');
  const setStatus = (msg: string) => {
    if (!status) return;

    status.textContent = msg;
  };

  // Deleting a token deletes it from Vault too (#125)
  root.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-delete]'
    );
    const tokenId = btn?.dataset.tokenId ?? '';

    if (!btn || !tokenId) return;

    // A native confirm: accessible, and deleting can't be undone
    // eslint-disable-next-line no-alert -- the confirmation #125 asks for
    const confirmed = window.confirm(
      `Delete the token “${btn.dataset.label ?? ''}”? The site can no longer use it, and it is deleted from the database.`
    );

    if (!confirmed) return;

    btn.disabled = true;
    setStatus('Deleting the token…');

    try {
      await deleteProviderToken(supabase, { token_id: tokenId }, opts.signal);
      window.location.reload();
    } catch (err: any) {
      btn.disabled = false;
      setStatus(err?.message ?? 'Failed to delete the token.');
    }
  });

  root.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    const btn = t.closest<HTMLButtonElement>('[data-make-active]');

    if (!btn) return;

    const tokenId = btn.dataset.tokenId ?? '';

    if (!tokenId) return;

    btn.disabled = true;
    setStatus('Setting active npm token…');

    try {
      await setActiveProviderToken(
        supabase,
        { provider: 'npm', token_id: tokenId },
        opts.signal
      );

      // simplest + robust: reload route
      window.location.reload();
    } catch (err: any) {
      btn.disabled = false;
      setStatus(err?.message ?? 'Failed to set active token.');
    }
  });
};
