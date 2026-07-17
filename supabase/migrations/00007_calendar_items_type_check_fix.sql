-- Sprint 1.9 — diagnostic CHECK + extension idempotente calendar_items
-- Ne supprime aucune donnée.

CREATE OR REPLACE FUNCTION public.get_calendar_items_check_definitions()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'constraint_name', c.conname,
        'definition', pg_get_constraintdef(c.oid)
      )
      ORDER BY c.conname
    ),
    '[]'::jsonb
  )
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'calendar_items'
    AND c.contype = 'c';
$$;

GRANT EXECUTE ON FUNCTION public.get_calendar_items_check_definitions() TO anon, authenticated;

DO $$
DECLARE
  current_def text;
BEGIN
  SELECT pg_get_constraintdef(c.oid)
  INTO current_def
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'calendar_items'
    AND c.conname = 'calendar_items_item_type_check';

  IF current_def IS NULL THEN
    ALTER TABLE public.calendar_items
      ADD CONSTRAINT calendar_items_item_type_check
      CHECK (
        item_type IN (
          'task',
          'event',
          'routine',
          'buffer',
          'constraint',
          'margin'
        )
      );
  ELSE
    ALTER TABLE public.calendar_items
      DROP CONSTRAINT calendar_items_item_type_check;

    ALTER TABLE public.calendar_items
      ADD CONSTRAINT calendar_items_item_type_check
      CHECK (
        item_type IN (
          'task',
          'event',
          'routine',
          'buffer',
          'constraint',
          'margin'
        )
      );
  END IF;
END $$;

DO $$
DECLARE
  current_def text;
BEGIN
  SELECT pg_get_constraintdef(c.oid)
  INTO current_def
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'calendar_items'
    AND c.conname = 'calendar_items_source_check';

  IF current_def IS NULL THEN
    ALTER TABLE public.calendar_items
      ADD CONSTRAINT calendar_items_source_check
      CHECK (
        source IN (
          'user',
          'ai',
          'calendar_sync',
          'system',
          'engine',
          'manual'
        )
      );
  ELSE
    ALTER TABLE public.calendar_items
      DROP CONSTRAINT calendar_items_source_check;

    ALTER TABLE public.calendar_items
      ADD CONSTRAINT calendar_items_source_check
      CHECK (
        source IN (
          'user',
          'ai',
          'calendar_sync',
          'system',
          'engine',
          'manual'
        )
      );
  END IF;
END $$;

COMMENT ON FUNCTION public.get_calendar_items_check_definitions() IS
  'Retourne les définitions CHECK de calendar_items pour diagnostic Sprint 1.9.';
