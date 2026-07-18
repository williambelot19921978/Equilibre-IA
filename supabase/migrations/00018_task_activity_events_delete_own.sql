-- Permet au compte authentifié de supprimer ses propres événements d'activité
-- (cleanup E2E et réinitialisation utilisateur).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'task_activity_events'
      AND policyname = 'task_activity_events_delete_own'
  ) THEN
    CREATE POLICY "task_activity_events_delete_own"
      ON public.task_activity_events FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END $$;
