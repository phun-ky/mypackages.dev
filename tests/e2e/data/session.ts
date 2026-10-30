import { Buffer } from 'node:buffer';

// Where supabase-js keeps the session and the PKCE code verifier, named
// after the project in VITE_SUPABASE_URL in .env.e2e
export const STORAGE_KEY = 'sb-zendzcuvkwbszzyjfefa-auth-token';

const base64url = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');
const expiresAt = Math.floor(Date.now() / 1000) + 3600;

export const user = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'someone@example.com',
  app_metadata: { provider: 'github' },
  user_metadata: {
    user_name: 'someone',
    name: 'Some One',
    avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4'
  },
  created_at: '2026-10-20T00:00:00Z'
};

export const session = {
  access_token: [
    base64url({ alg: 'HS256', typ: 'JWT' }),
    base64url({ sub: user.id, role: 'authenticated', exp: expiresAt }),
    'signature'
  ].join('.'),
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: expiresAt,
  refresh_token: 'refresh-token',
  user
};
