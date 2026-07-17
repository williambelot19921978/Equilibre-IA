-- Sprint 4.4 — Journée réaliste, repas, actions flexibles, historique comportemental

ALTER TABLE public.user_home_preferences
  ADD COLUMN IF NOT EXISTS calendar_widget_position text NOT NULL DEFAULT 'header_right'
    CHECK (calendar_widget_position IN ('hidden', 'header_right', 'drawer'));

ALTER TABLE public.user_home_preferences
  ADD COLUMN IF NOT EXISTS calendar_widget_position_mobile text NOT NULL DEFAULT 'hidden'
    CHECK (calendar_widget_position_mobile IN ('hidden', 'header_right', 'drawer'));

ALTER TABLE public.user_home_preferences
  ADD COLUMN IF NOT EXISTS meal_settings jsonb NOT NULL DEFAULT '{
    "breakfast": {"enabled": true, "durationMinutes": 20, "usualTime": null},
    "dinner": {"durationMinutes": 30, "usualTime": null, "beforeEveningRoutine": true}
  }'::jsonb;

COMMENT ON COLUMN public.user_home_preferences.calendar_widget_position IS
  'Position du mini-calendrier sur desktop : hidden | header_right | drawer';

COMMENT ON COLUMN public.user_home_preferences.calendar_widget_position_mobile IS
  'Position du mini-calendrier sur mobile : hidden | header_right | drawer';

COMMENT ON COLUMN public.user_home_preferences.meal_settings IS
  'Repas principaux : petit déjeuner et dîner (durée, horaires)';

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS cancellation_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS last_cancelled_at timestamptz;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS consecutive_cancellations integer NOT NULL DEFAULT 0;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS last_completed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.task_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  calendar_item_id uuid REFERENCES public.calendar_items(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'created', 'planned', 'started', 'completed',
    'skipped', 'cancelled', 'shortened', 'moved'
  )),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_activity_events_user
  ON public.task_activity_events (user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_activity_events_task
  ON public.task_activity_events (task_id, occurred_at DESC);

ALTER TABLE public.task_activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_activity_events_select_own"
  ON public.task_activity_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "task_activity_events_insert_own"
  ON public.task_activity_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.task_activity_events IS
  'Historique comportemental des tâches et blocs (annulations, reports, complétions)';
