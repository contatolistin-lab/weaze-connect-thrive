-- Fix B2C groups security without dropping existing policies
-- Uses AS RESTRICTIVE (PG 15+) to AND with existing permissive policies
-- Does NOT drop any existing policy

-- Ensure groups_select still exists (defensive: migration 05 may have dropped it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'groups'
      AND schemaname = 'public'
      AND policyname = 'groups_select'
  ) THEN
    CREATE POLICY "groups_select" ON public.groups
      FOR SELECT
      USING (true);
  END IF;
END
$$;

-- Add restrictive policy: only group members can SELECT
-- This ANDs with existing permissive policies (groups_select, groups_select_tenant, etc.)
-- Effective result: user must be a group_member to see the row
DROP POLICY IF EXISTS "groups_select_member" ON public.groups;
CREATE POLICY "groups_select_member" ON public.groups
  AS RESTRICTIVE
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
    )
  );

-- Index for notification dedup query in trg_notify_group_invite
-- Query filters: user_id, type='group_invite', reference_id=group_id, created_at > now()-24h
CREATE INDEX IF NOT EXISTS idx_notifications_dedup_group
  ON public.notifications(user_id, type, reference_id, created_at DESC);
