-- Sprint 1.7b — Aligner la doc CHECK source sur le schéma Supabase réel
-- Le schéma distant autorise : user | ai | calendar_sync | system
-- (pas engine / manual). Ne modifie pas les lignes existantes.

COMMENT ON COLUMN public.calendar_items.source IS
  'Origine du bloc : user (manuel), ai (planning engine), calendar_sync, system';
