DROP POLICY IF EXISTS "groups_select" ON public.groups;

CREATE POLICY "groups_select_member" ON public.groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
  )
);
