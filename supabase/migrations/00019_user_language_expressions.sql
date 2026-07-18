-- Sprint ai-core-language-memory-v1 — expressions personnelles par utilisateur

CREATE TABLE IF NOT EXISTS public.user_language_expressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  normalized_expression text NOT NULL,
  original_examples jsonb NOT NULL DEFAULT '[]'::jsonb,
  resolved_intent text NOT NULL,
  resolved_meaning text NOT NULL,
  confidence numeric(4, 3) NOT NULL DEFAULT 0.280
    CHECK (confidence >= 0 AND confidence <= 1),
  confirmation_count integer NOT NULL DEFAULT 0 CHECK (confirmation_count >= 0),
  rejection_count integer NOT NULL DEFAULT 0 CHECK (rejection_count >= 0),
  usage_count integer NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  contexts jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'candidate'
    CHECK (status IN ('candidate', 'learning', 'confirmed', 'rejected', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  last_confirmed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_language_expressions_user_expr_unique
    UNIQUE (user_id, normalized_expression)
);

CREATE INDEX IF NOT EXISTS idx_user_language_expressions_user_status
  ON public.user_language_expressions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_language_expressions_user_normalized
  ON public.user_language_expressions (user_id, normalized_expression);

CREATE TABLE IF NOT EXISTS public.language_learning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expression_id uuid REFERENCES public.user_language_expressions(id) ON DELETE SET NULL,
  event_type text NOT NULL
    CHECK (event_type IN ('hypothesis', 'confirm', 'reject', 'usage', 'decay', 'archive', 'reactivate')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_language_learning_events_user_created
  ON public.language_learning_events (user_id, created_at DESC);

ALTER TABLE public.user_language_expressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_learning_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_language_expressions_select_own"
  ON public.user_language_expressions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_language_expressions_insert_own"
  ON public.user_language_expressions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_language_expressions_update_own"
  ON public.user_language_expressions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_language_expressions_delete_own"
  ON public.user_language_expressions FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "language_learning_events_select_own"
  ON public.language_learning_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "language_learning_events_insert_own"
  ON public.language_learning_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.user_language_expressions IS
  'Mémoires linguistiques personnelles — expressions apprises par utilisateur';

COMMENT ON TABLE public.language_learning_events IS
  'Journal d''apprentissage linguistique (sans verbatim de conversation)';
