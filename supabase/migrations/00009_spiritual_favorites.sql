-- Sprint 2.8 — Favoris espace spirituel

CREATE TABLE IF NOT EXISTS public.spiritual_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  content_id text NOT NULL,
  content_type text NOT NULL,
  custom_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spiritual_favorites_user
  ON public.spiritual_favorites (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_spiritual_favorites_household
  ON public.spiritual_favorites (household_id);

ALTER TABLE public.spiritual_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spiritual_favorites_select_own"
  ON public.spiritual_favorites FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "spiritual_favorites_insert_own"
  ON public.spiritual_favorites FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "spiritual_favorites_delete_own"
  ON public.spiritual_favorites FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE public.spiritual_favorites IS
  'Phrases, prières et réflexions enregistrées par l''utilisateur';
