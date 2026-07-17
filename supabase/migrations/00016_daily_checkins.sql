-- Sprint 4.6 — Ressenti quotidien (check-in)

CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  checkin_date date NOT NULL,
  energy_level text,
  fatigue_level text,
  stress_level text,
  mood text NOT NULL,
  intensity smallint,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_checkins_user_date_unique UNIQUE (user_id, checkin_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date
  ON public.daily_checkins (user_id, checkin_date DESC);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_checkins_select_own"
  ON public.daily_checkins FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "daily_checkins_insert_own"
  ON public.daily_checkins FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_checkins_update_own"
  ON public.daily_checkins FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.daily_checkins IS
  'Ressenti quotidien utilisateur — une ligne par jour';
