-- Add RLS policy to allow owner/admin to see all profiles in their tenant
-- This fixes the group member search issue

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'B2B owners can view all profiles in tenant' 
    AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "B2B owners can view all profiles in tenant"
    ON public.profiles FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
        AND m.tenant_id IN (
          SELECT tenant_id FROM public.memberships 
          WHERE user_id = profiles.user_id
        )
      )
    );
  END IF;
END $$;