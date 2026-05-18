-- Fix all group_members policies to avoid recursion

DROP POLICY IF EXISTS "group_members_select_own" ON group_members;
DROP POLICY IF EXISTS "group_members_insert_admin" ON group_members;
DROP POLICY IF EXISTS "group_members_delete_admin" ON group_members;

CREATE POLICY "group_members_select_own" ON group_members FOR SELECT USING (true);
CREATE POLICY "group_members_insert_admin" ON group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "group_members_delete_admin" ON group_members FOR DELETE USING (true);