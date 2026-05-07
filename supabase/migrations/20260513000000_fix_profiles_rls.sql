-- Fix: Restringir política SELECT na tabela profiles
-- Apenas o próprio usuário pode ler seu perfil, ou owners/admins de um tenant para gestão da comunidade

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
      AND EXISTS (
        SELECT 1 FROM public.community_members cm
        WHERE cm.user_id = profiles.user_id
          AND cm.tenant_id = m.tenant_id
          AND cm.status = 'approved'
      )
  )
);