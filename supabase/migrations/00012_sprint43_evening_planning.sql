-- Sprint 4.3 — Planification du soir

ALTER TABLE public.user_home_preferences
  ADD COLUMN IF NOT EXISTS evening_planning_mode text NOT NULL DEFAULT 'suggestions_only'
    CHECK (evening_planning_mode IN ('automatic', 'suggestions_only', 'disabled'));

COMMENT ON COLUMN public.user_home_preferences.evening_planning_mode IS
  'Mode de planification du soir : automatic | suggestions_only | disabled';
