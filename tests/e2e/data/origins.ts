// The only other origins the site may contact: the APIs the browser calls for
// the data the site shows, and its own Supabase project. npm is reached
// through the Supabase functions, not from the browser. The CSP's connect-src
// lists exactly these (csp.e2e.ts).
export const ALLOWED_ORIGINS = [
  'https://zendzcuvkwbszzyjfefa.supabase.co',
  'https://api.github.com',
  'https://gitlab.com',
  'https://api.bitbucket.org',
  'https://dev.azure.com',
  'https://api.osv.dev'
];
