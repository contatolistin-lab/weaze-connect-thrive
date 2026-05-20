-- Fix posts delete RLS policy to allow admins (not just owners) to delete posts
-- The frontend shows delete button for both owner and admin roles,
-- but the policy only allowed owner role (via is_tenant_owner).

-- Recreate delete policy to include admin role
DROP POLICY IF EXISTS "posts_delete_owner" ON public.posts;
CREATE POLICY "posts_delete_owner" ON public.posts FOR DELETE USING (
  auth.uid() = author_id
  OR EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid()
    AND tenant_id = posts.tenant_id
    AND role IN ('owner', 'admin')
    AND is_active = true
  )
);

-- Also fix update policy for consistency (admins should update too)
DROP POLICY IF EXISTS "posts_update_owner" ON public.posts;
CREATE POLICY "posts_update_owner" ON public.posts FOR UPDATE USING (
  auth.uid() = author_id
  OR EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid()
    AND tenant_id = posts.tenant_id
    AND role IN ('owner', 'admin')
    AND is_active = true
  )
);
