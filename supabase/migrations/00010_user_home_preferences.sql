-- Sprint 4.1 — Préférences d'affichage de l'accueil

CREATE TABLE IF NOT EXISTS public.user_home_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  visible_widgets jsonb NOT NULL DEFAULT '[]'::jsonb,
  widget_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  compact_mode boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_home_preferences_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_home_preferences_user
  ON public.user_home_preferences (user_id);

ALTER TABLE public.user_home_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_home_preferences_select_own"
  ON public.user_home_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_home_preferences_insert_own"
  ON public.user_home_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_home_preferences_update_own"
  ON public.user_home_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.user_home_preferences IS
  'Widgets visibles et ordre de l''accueil par utilisateur';
