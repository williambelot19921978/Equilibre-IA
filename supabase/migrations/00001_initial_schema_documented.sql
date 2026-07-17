-- Équilibre IA — Schéma initial documenté (Sprint 0)
-- Source de vérité côté client : src/types/database.ts
-- Ce fichier documente le schéma Supabase existant ; les policies RLS
-- sont gérées dans le dashboard Supabase jusqu'à migration dédiée.

-- profiles (extension auth.users)
-- id uuid PK REFERENCES auth.users
-- onboarding_completed boolean DEFAULT false
-- created_at timestamptz
-- updated_at timestamptz

-- households
-- id uuid PK DEFAULT gen_random_uuid()
-- name text NOT NULL
-- created_at timestamptz DEFAULT now()

-- household_members
-- household_id uuid REFERENCES households(id)
-- user_id uuid REFERENCES auth.users(id)
-- display_name text NOT NULL
-- role text
-- UNIQUE (user_id) en V1

-- children
-- id uuid PK DEFAULT gen_random_uuid()
-- household_id uuid REFERENCES households(id) NOT NULL
-- first_name text NOT NULL
-- birth_date date
-- created_at timestamptz DEFAULT now()

-- profile_facts
-- id uuid PK
-- household_id uuid REFERENCES households(id) NOT NULL
-- user_id uuid REFERENCES auth.users(id) NOT NULL
-- fact_key text NOT NULL
-- fact_value jsonb NOT NULL
-- source text
-- confidence numeric
-- last_asked_at timestamptz
-- updated_at timestamptz
-- created_at timestamptz
-- UNIQUE (user_id, fact_key)

-- tasks
-- id uuid PK DEFAULT gen_random_uuid()
-- household_id uuid REFERENCES households(id) NOT NULL
-- assigned_to uuid REFERENCES auth.users(id)
-- created_by uuid REFERENCES auth.users(id) NOT NULL
-- title text NOT NULL
-- description text
-- category text NOT NULL
-- estimated_minutes integer
-- due_at timestamptz
-- priority integer NOT NULL
-- splittable boolean DEFAULT true
-- status text NOT NULL DEFAULT 'todo'
-- skip_count integer DEFAULT 0
-- created_at timestamptz DEFAULT now()
-- updated_at timestamptz

-- RPC: create_household_for_current_user(household_name text, display_name text)
-- Crée households + household_members pour auth.uid()

COMMENT ON SCHEMA public IS 'Équilibre IA — schéma documenté Sprint 0';
