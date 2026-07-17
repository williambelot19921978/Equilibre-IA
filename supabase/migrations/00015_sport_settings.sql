-- Sprint 4.5 complement — Préférences sport (niveau, types, matériel, durée)

ALTER TABLE public.user_home_preferences
  ADD COLUMN IF NOT EXISTS sport_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.user_home_preferences.sport_settings IS
  'Préférences sport : niveau, types préférés/refusés, matériel, durée, intensité';
