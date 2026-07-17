-- Sprint 4.2 — Rythmes de travail variables + sidebar collapsed

ALTER TABLE public.user_home_preferences
  ADD COLUMN IF NOT EXISTS sidebar_collapsed boolean NOT NULL DEFAULT false;

ALTER TABLE public.user_home_preferences
  ADD COLUMN IF NOT EXISTS show_saint_calendar boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.user_home_preferences.sidebar_collapsed IS
  'Navigation latérale repliée (mode icônes uniquement)';

COMMENT ON COLUMN public.user_home_preferences.show_saint_calendar IS
  'Afficher le saint ou la fête du jour dans la carte motivation';

CREATE TABLE IF NOT EXISTS public.work_schedule_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT 'Mon rythme',
  pattern_type text NOT NULL DEFAULT 'fixed_week'
    CHECK (pattern_type IN ('fixed_week', 'alternating_weeks', 'cycle', 'custom_rotation')),
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  cycle_length_weeks integer NOT NULL DEFAULT 1
    CHECK (cycle_length_weeks >= 1 AND cycle_length_weeks <= 8),
  reference_week date,
  schedule jsonb NOT NULL DEFAULT '{}'::jsonb,
  compensatory_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_schedule_patterns_user
  ON public.work_schedule_patterns (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_work_schedule_patterns_active_user
  ON public.work_schedule_patterns (user_id)
  WHERE active = true;

ALTER TABLE public.work_schedule_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_schedule_patterns_select_own"
  ON public.work_schedule_patterns FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "work_schedule_patterns_insert_own"
  ON public.work_schedule_patterns FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "work_schedule_patterns_update_own"
  ON public.work_schedule_patterns FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "work_schedule_patterns_delete_own"
  ON public.work_schedule_patterns FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE public.work_schedule_patterns IS
  'Rythmes professionnels variables (semaines alternées, cycles, repos compensateur)';
