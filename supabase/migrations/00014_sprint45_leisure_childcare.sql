-- Sprint 4.5 — Loisirs, garde enfants, calendrier drawer par défaut

ALTER TABLE public.user_home_preferences
  ALTER COLUMN calendar_widget_position SET DEFAULT 'drawer';

ALTER TABLE public.user_home_preferences
  ALTER COLUMN calendar_widget_position_mobile SET DEFAULT 'drawer';

CREATE TABLE IF NOT EXISTS public.leisure_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  activity_id text NOT NULL,
  category text NOT NULL CHECK (category IN ('sport', 'music', 'leisure')),
  custom_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leisure_favorites_user
  ON public.leisure_favorites (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leisure_favorites_household
  ON public.leisure_favorites (household_id);

ALTER TABLE public.leisure_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leisure_favorites_select_own"
  ON public.leisure_favorites FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "leisure_favorites_insert_own"
  ON public.leisure_favorites FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "leisure_favorites_delete_own"
  ON public.leisure_favorites FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE public.leisure_favorites IS
  'Activités loisirs enregistrées par l''utilisateur';
