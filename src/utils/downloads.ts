// How downloads are counted, shared with the portfolio-snapshot function so
// the front page example and the pages agree (#94)
export * from '../../supabase/functions/_shared/downloads';

/** `2026-09` as `September 2026` */
export const monthName = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });

/** `2026-10-28` as `28 Oct 2026` */
export const dayName = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
