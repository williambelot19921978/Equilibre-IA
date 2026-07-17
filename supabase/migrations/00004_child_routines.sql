-- Sprint 1.6 — Routines par enfant (couchers, durées)

CREATE TABLE IF NOT EXISTS public.child_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  bedtime_weekday time,
  bedtime_weekend time,
  evening_routine_minutes integer,
  wake_time time,
  school_days text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT child_routines_unique_child UNIQUE (child_id)
);

CREATE INDEX IF NOT EXISTS idx_child_routines_household
  ON public.child_routines (household_id);

ALTER TABLE public.child_routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "child_routines_select_household"
  ON public.child_routines FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "child_routines_insert_household"
  ON public.child_routines FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "child_routines_update_household"
  ON public.child_routines FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "child_routines_delete_household"
  ON public.child_routines FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.child_routines IS
  'Horaires et routines par enfant pour le planning du soir';
