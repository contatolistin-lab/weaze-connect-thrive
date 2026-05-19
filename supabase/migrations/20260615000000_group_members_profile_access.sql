-- Allow group members to see each other's profiles for group posts/replies

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Group members can view member profiles' 
    AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Group members can view member profiles"
    ON public.profiles FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.group_members gm2
          WHERE gm2.group_id = gm.group_id
          AND gm2.user_id = profiles.user_id
        )
      )
      OR
      EXISTS (
        SELECT 1 FROM public.group_posts gp
        WHERE gp.author_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.group_members gm
          WHERE gm.group_id = gp.group_id
          AND gm.user_id = profiles.user_id
        )
      )
      OR
      EXISTS (
        SELECT 1 FROM public.group_replies gr
        WHERE gr.author_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.group_members gm
          WHERE gm.group_id = gr.post_id
          AND gm.user_id = profiles.user_id
        )
      )
    );
  END IF;
END $$;