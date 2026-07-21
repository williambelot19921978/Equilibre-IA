-- Sprint P0/P1 — Core profiles + household RLS (idempotent)
-- Versionne les policies cœur absentes de 00001 (dashboard-only).

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "households_select_member" ON public.households;
CREATE POLICY "households_select_member"
  ON public.households FOR SELECT
  USING (
    id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "households_insert_authenticated" ON public.households;
CREATE POLICY "households_insert_authenticated"
  ON public.households FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "households_update_member" ON public.households;
CREATE POLICY "households_update_member"
  ON public.households FOR UPDATE
  USING (
    id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "household_members_select_own_household" ON public.household_members;
CREATE POLICY "household_members_select_own_household"
  ON public.household_members FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members AS hm
      WHERE hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "household_members_insert_own" ON public.household_members;
CREATE POLICY "household_members_insert_own"
  ON public.household_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "household_members_update_own" ON public.household_members;
CREATE POLICY "household_members_update_own"
  ON public.household_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.households TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.household_members TO authenticated;

COMMENT ON TABLE public.profiles IS 'Profil utilisateur — RLS versionnée Sprint P0/P1';
