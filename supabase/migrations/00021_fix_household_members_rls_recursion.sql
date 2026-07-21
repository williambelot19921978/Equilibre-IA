-- Hotfix — remove recursive household_members SELECT policy (00020 side-effect)
-- Root cause: policy querying household_members from within household_members RLS.
-- Safe pattern: reuse public.is_household_member(uuid) (SECURITY DEFINER).

DROP POLICY IF EXISTS "household_members_select_own_household" ON public.household_members;

CREATE POLICY "household_members_select_own_household"
  ON public.household_members FOR SELECT
  USING (public.is_household_member(household_id));
