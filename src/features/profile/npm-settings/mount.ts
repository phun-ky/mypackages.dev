import { supabase } from '../../../services/supabase';

export type UserSettingsRow = {
  user_id: string;
  npm_username: string | null;
  npm_email: string | null;
  lookup_as_maintainer: boolean;
  npm_query_size: number;
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export const mountNpmSettings = async (
  root: HTMLElement,
  signal?: AbortSignal
) => {
  const form = root.querySelector('form.well.npm-settings');

  if (!(form instanceof HTMLFormElement)) return;

  // Better: scope to the Npm form specifically
  // e.g. add class="well npm-settings" and query "form.well.npm-settings"
  // For now, try to locate fields; if not found, bail.
  const npmUsername = root.querySelector(
    '#npmusername'
  ) as HTMLInputElement | null;
  const npmEmail = root.querySelector('#npmemail') as HTMLInputElement | null;
  const roleToggle = root.querySelector(
    '#author-maintainer'
  ) as HTMLInputElement | null;
  const querySize = root.querySelector(
    '#npm-query-size'
  ) as HTMLInputElement | null;
  // Optional: a status element (recommended)
  // Add <span class="status"></span> near your Save button like you do for ensured packages.
  const status = form.querySelector('.status') as HTMLElement | null;
  const setStatus = (msg: string) => {
    if (status) status.textContent = msg;
  };

  if (!npmUsername || !npmEmail || !roleToggle || !querySize) return;

  // Get logged-in user
  const { data: session, error: authErr } = await supabase.auth.getUser();

  if (authErr || !session?.user) {
    setStatus('Not logged in.');

    return;
  }

  const userId = session.user.id;

  // Fetch current settings
  setStatus('Loading…');

  const { data, error } = await supabase
    .from('user_settings')
    .select(
      'user_id,npm_username,npm_email,lookup_as_maintainer,npm_query_size'
    )
    .eq('user_id', userId)
    .maybeSingle();

  // Note: supabase-js doesn't currently accept AbortSignal per query in a standard way.
  // If you need hard aborts, use fetch customization at client creation.

  if (error) {
    // If row doesn’t exist yet, that’s fine.
    setStatus('');
  } else if (data) {
    const row = data as UserSettingsRow;

    npmUsername.value = row.npm_username ?? '';
    npmEmail.value = row.npm_email ?? '';
    roleToggle.checked = Boolean(row.lookup_as_maintainer);
    querySize.value = String(row.npm_query_size ?? 50);
    setStatus('');
  } else {
    // No row yet
    querySize.value = '50';
    roleToggle.checked = false;
    setStatus('');
  }

  // Save handler
  const onSubmit = async (e: Event) => {
    e.preventDefault();

    const npm_query_size_raw = Number(querySize.value || 50);
    const npm_query_size = clamp(
      Number.isFinite(npm_query_size_raw) ? npm_query_size_raw : 50,
      1,
      250
    );

    // Keep UI consistent with what we store
    querySize.value = String(npm_query_size);

    setStatus('Saving…');

    const payload = {
      user_id: userId,
      npm_username: npmUsername.value.trim() || null,
      npm_email: npmEmail.value.trim() || null,
      lookup_as_maintainer: Boolean(roleToggle.checked),
      npm_query_size
    };
    const { error: upsertError } = await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' });

    if (upsertError) {
      setStatus(`Save failed: ${upsertError.message}`);

      return;
    }

    setStatus('Saved.');
    // Optional: clear after a bit
    setTimeout(() => setStatus(''), 1500);
  };

  form.addEventListener('submit', onSubmit, { signal });
};
