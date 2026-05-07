-- Fix: Restringir política SELECT na tabela tenants
-- Apenas membros do tenant ou admins podem ver os dados do tenant
-- Protege phone e mrr (dados financeiros)

DROP POLICY IF EXISTS "tenants_select_all" ON public.tenants;
DROP POLICY IF EXISTS "tenants_select_members" ON public.tenants;

CREATE POLICY "tenants_select_members" ON public.tenants FOR SELECT USING (
  public.is_tenant_member(auth.uid(), id)
  OR public.has_role(auth.uid(), 'admin')
);

-- Lives: também expor dados sensíveis - restringir para membros
DROP POLICY IF EXISTS lives_select_all ON public.lives;
CREATE POLICY lives_select_members ON public.lives FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id));