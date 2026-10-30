import { expect, mockSupabaseFunction, test, waitForApp } from './fixtures';
import { signIn } from './mocks';

// A signed-in user deletes a stored token (#125)
const TOKEN = {
  id: '00000000-0000-4000-8000-0000000000a1',
  provider: 'npm',
  label: 'laptop',
  meta: {},
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z'
};

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await mockSupabaseFunction(page, 'list-secrets', () => ({
    ok: true,
    items: [TOKEN]
  }));
  await mockSupabaseFunction(page, 'get-active-token-meta', () => ({
    ok: true,
    active: { token_id: TOKEN.id, provider: 'npm', label: TOKEN.label }
  }));
});

test('deletes a token after confirming', async ({ page }) => {
  const deleted: unknown[] = [];

  await mockSupabaseFunction(page, 'delete-secret', (body) => {
    deleted.push(body);

    return { ok: true };
  });
  await page.goto('/profile/secrets');
  await waitForApp(page);

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Delete the token “laptop”?');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Delete laptop' }).click();

  await expect.poll(() => deleted).toEqual([{ token_id: TOKEN.id }]);
});

test('keeps the token when the confirmation is cancelled', async ({ page }) => {
  const requests: string[] = [];

  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/profile/secrets');
  await waitForApp(page);

  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Delete laptop' }).click();

  await expect(
    page.getByRole('button', { name: 'Delete laptop' })
  ).toBeEnabled();
  expect(requests.filter((url) => url.includes('delete-secret'))).toEqual([]);
});
