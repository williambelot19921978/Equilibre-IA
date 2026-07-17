-- Sprint 1.6 — Périodes de contexte familial daté

CREATE TABLE IF NOT EXISTS public.family_context_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  context_type text NOT NULL,
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  affected_member_id uuid REFERENCES public.children(id) ON DELETE SET NULL,
  impact jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_context_periods_dates CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_family_context_periods_household_dates
  ON public.family_context_periods (household_id, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_family_context_periods_status
  ON public.family_context_periods (household_id, status);

ALTER TABLE public.family_context_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_context_select_household"
  ON public.family_context_periods FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "family_context_insert_household"
  ON public.family_context_periods FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "family_context_update_household"
  ON public.family_context_periods FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "family_context_delete_household"
  ON public.family_context_periods FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.family_context_periods IS
  'Contexte familial temporaire (vacances, absences, parent seul…)';
