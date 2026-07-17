-- Équilibre IA — Table calendar_items documentée (Sprint 1)
-- La table existe déjà côté Supabase ; ce fichier documente le schéma
-- utilisé par le Planning Engine. Aucune modification destructive.

-- calendar_items
-- id uuid PK DEFAULT gen_random_uuid()
-- household_id uuid REFERENCES households(id) NOT NULL
-- user_id uuid REFERENCES auth.users(id) NOT NULL
-- task_id uuid REFERENCES tasks(id) ON DELETE SET NULL
-- title text NOT NULL
-- item_type text NOT NULL  -- constraint | task | buffer | margin
-- starts_at timestamptz NOT NULL
-- ends_at timestamptz NOT NULL
-- locked boolean NOT NULL DEFAULT false
-- source text NOT NULL DEFAULT 'engine'  -- engine | manual
-- details jsonb  -- explanation, status, facts, segmentIndex, constraintType...
-- created_at timestamptz DEFAULT now()
-- updated_at timestamptz DEFAULT now()

-- Index recommandé (à appliquer si absent) :
-- CREATE INDEX IF NOT EXISTS idx_calendar_items_household_date
--   ON calendar_items (household_id, starts_at);

COMMENT ON TABLE public.calendar_items IS
  'Planning vivant — blocs journaliers (contraintes, tâches, marges)';
