-- Sprint 1.7 — calendar_items + RLS idempotent (correctif stabilité)
-- Ne supprime aucune donnée existante.

CREATE TABLE IF NOT EXISTS public.calendar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  title text NOT NULL,
  item_type text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  locked boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'engine',
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calendar_items_dates CHECK (ends_at > starts_at)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calendar_items_item_type_check'
  ) THEN
    ALTER TABLE public.calendar_items
      ADD CONSTRAINT calendar_items_item_type_check
      CHECK (item_type IN ('constraint', 'task', 'buffer', 'margin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calendar_items_source_check'
  ) THEN
    ALTER TABLE public.calendar_items
      ADD CONSTRAINT calendar_items_source_check
      CHECK (source IN ('engine', 'manual'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_calendar_items_household_date
  ON public.calendar_items (household_id, starts_at);

ALTER TABLE public.calendar_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_items_select_household" ON public.calendar_items;
CREATE POLICY "calendar_items_select_household"
  ON public.calendar_items FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "calendar_items_insert_household" ON public.calendar_items;
CREATE POLICY "calendar_items_insert_household"
  ON public.calendar_items FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "calendar_items_update_household" ON public.calendar_items;
CREATE POLICY "calendar_items_update_household"
  ON public.calendar_items FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "calendar_items_delete_household" ON public.calendar_items;
CREATE POLICY "calendar_items_delete_household"
  ON public.calendar_items FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_items TO authenticated;

-- tasks — policies idempotentes (si RLS activé sans policy)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_select_household" ON public.tasks;
CREATE POLICY "tasks_select_household"
  ON public.tasks FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tasks_insert_household" ON public.tasks;
CREATE POLICY "tasks_insert_household"
  ON public.tasks FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "tasks_update_household" ON public.tasks;
CREATE POLICY "tasks_update_household"
  ON public.tasks FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tasks_delete_household" ON public.tasks;
CREATE POLICY "tasks_delete_household"
  ON public.tasks FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;

COMMENT ON TABLE public.calendar_items IS
  'Planning vivant — blocs journaliers (Sprint 1.7 RLS corrigé)';
