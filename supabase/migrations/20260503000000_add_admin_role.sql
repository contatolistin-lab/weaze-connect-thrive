-- Add admin role to tenant_role and fix permission functions
ALTER TYPE public.tenant_role ADD VALUE IF NOT EXISTS 'admin';

-- Create is_tenant_admin function
CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.memberships WHERE user_id=_user_id AND tenant_id=_tenant_id AND role='admin');
$$;

-- Create can_manage_live function (owner OR admin)
CREATE OR REPLACE FUNCTION public.can_manage_live(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id=_user_id 
    AND tenant_id=_tenant_id 
    AND role IN ('owner', 'admin')
  );
$$;