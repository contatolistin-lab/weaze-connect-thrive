-- Fix RLS for groups feature
-- Run this in Supabase SQL Editor

-- Enable RLS if not already enabled
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_replies ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "groups_select" ON groups;
DROP POLICY IF EXISTS "groups_insert" ON groups;
DROP POLICY IF EXISTS "groups_update" ON groups;
DROP POLICY IF EXISTS "groups_delete" ON groups;

DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
DROP POLICY IF EXISTS "group_members_delete" ON group_members;

DROP POLICY IF EXISTS "group_posts_select" ON group_posts;
DROP POLICY IF EXISTS "group_posts_insert" ON group_posts;
DROP POLICY IF EXISTS "group_posts_update" ON group_posts;
DROP POLICY IF EXISTS "group_posts_delete" ON group_posts;

DROP POLICY IF EXISTS "group_replies_select" ON group_replies;
DROP POLICY IF EXISTS "group_replies_insert" ON group_replies;
DROP POLICY IF EXISTS "group_replies_delete" ON group_replies;

-- Create open policies for groups
CREATE POLICY "groups_select" ON groups FOR SELECT USING (true);
CREATE POLICY "groups_insert" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "groups_update" ON groups FOR UPDATE USING (true);
CREATE POLICY "groups_delete" ON groups FOR DELETE USING (true);

-- Create open policies for group_members
CREATE POLICY "group_members_select" ON group_members FOR SELECT USING (true);
CREATE POLICY "group_members_insert" ON group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "group_members_delete" ON group_members FOR DELETE USING (true);

-- Create open policies for group_posts
CREATE POLICY "group_posts_select" ON group_posts FOR SELECT USING (true);
CREATE POLICY "group_posts_insert" ON group_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "group_posts_update" ON group_posts FOR UPDATE USING (true);
CREATE POLICY "group_posts_delete" ON group_posts FOR DELETE USING (true);

-- Create open policies for group_replies
CREATE POLICY "group_replies_select" ON group_replies FOR SELECT USING (true);
CREATE POLICY "group_replies_insert" ON group_replies FOR INSERT WITH CHECK (true);
CREATE POLICY "group_replies_delete" ON group_replies FOR DELETE USING (true);

-- Also fix memberships read - add open policy for read
DROP POLICY IF EXISTS "memberships_groups_read" ON memberships;
CREATE POLICY "memberships_groups_read" ON memberships FOR SELECT USING (true);

-- Verify policies created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('groups', 'group_members', 'group_posts', 'group_replies', 'memberships')
AND policyname LIKE '%groups%' OR tablename = 'memberships';