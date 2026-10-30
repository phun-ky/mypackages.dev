-- Profile pictures as an opt-in setting (#37) ---------------------------------

-- GitHub avatars and Gravatar images tell those services who looks at which
-- page, so the site shows initials unless a signed-in user turns pictures
-- on. The table's grants and policies cover the new column: signed-in users
-- read and save their own row.
alter table public.user_settings
  add column show_profile_pictures boolean not null default false;

comment on column public.user_settings.show_profile_pictures is
  'Show profile pictures from GitHub and gravatar.com instead of initials';
