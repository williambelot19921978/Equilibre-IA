-- Repair: migrations 00012 and 00015 were not applied on remote Supabase.
-- Idempotent — safe to re-run.

ALTER TABLE public.user_home_preferences
  ADD COLUMN IF NOT EXISTS evening_planning_mode text NOT NULL DEFAULT 'suggestions_only'
    CHECK (evening_planning_mode IN ('automatic', 'suggestions_only', 'disabled'));

COMMENT ON COLUMN public.user_home_preferences.evening_planning_mode IS
  'Mode de planification du soir : automatic | suggestions_only | disabled';

ALTER TABLE public.user_home_preferences
  ADD COLUMN IF NOT EXISTS sport_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.user_home_preferences.sport_settings IS
  'Préférences sport : niveau, types préférés/refusés, matériel, durée, intensité';
