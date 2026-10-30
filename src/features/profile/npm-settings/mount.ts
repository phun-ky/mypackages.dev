import { supabase } from '../../../services/supabase';
import { forgetUserSettings } from '../../../services/supabase/utils/user-settings';

export type UserSettingsRow = {
  user_id: string;
  npm_username: string | null;
  npm_email: string | null;
};

export const mountNpmSettings = async (
  root: HTMLElement,
  signal?: AbortSignal
) => {
  const form = root.querySelector('form.npm-settings');

  if (!(form instanceof HTMLFormElement)) return;

  const npmUsername = root.querySelector(
    '#npmusername'
  ) as HTMLInputElement | null;
  const npmEmail = root.querySelector('#npmemail') as HTMLInputElement | null;
  const status = form.querySelector('.status') as HTMLElement | null;
  const setStatus = (msg: string) => {
    if (status) status.textContent = msg;
  };

  if (!npmUsername || !npmEmail) return;

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
    .select('user_id,npm_username,npm_email')
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
    setStatus('');
  } else {
    setStatus('');
  }

  // Save handler
  const onSubmit = async (e: Event) => {
    e.preventDefault();

    setStatus('Saving…');

    const payload = {
      user_id: userId,
      npm_username: npmUsername.value.trim() || null,
      npm_email: npmEmail.value.trim() || null
    };
    const { error: upsertError } = await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' });

    // The npm username decides whose tracked packages are whose (#113)
    forgetUserSettings(userId);

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
