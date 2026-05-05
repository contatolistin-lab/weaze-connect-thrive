-- Ensure community_members table exists
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  UNIQUE(user_id, tenant_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own membership" ON public.community_members
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Tenant owners can manage memberships" ON public.community_members
    FOR ALL USING (
      EXISTS (SELECT 1 FROM public.memberships m
        WHERE m.tenant_id = community_members.tenant_id
          AND m.user_id = auth.uid()
          AND m.role IN ('owner','admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- get_member_status: tenant members are auto-approved
CREATE OR REPLACE FUNCTION public.get_member_status(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_status TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN 'none'; END IF;

  IF EXISTS (SELECT 1 FROM public.memberships WHERE user_id = v_user_id AND tenant_id = p_tenant_id) THEN
    INSERT INTO public.community_members (user_id, tenant_id, status, approved_at)
    VALUES (v_user_id, p_tenant_id, 'approved', now())
    ON CONFLICT (user_id, tenant_id) DO UPDATE
      SET status = 'approved',
          approved_at = COALESCE(public.community_members.approved_at, now());
    RETURN 'approved';
  END IF;

  SELECT status INTO v_status FROM public.community_members
   WHERE user_id = v_user_id AND tenant_id = p_tenant_id;
  RETURN COALESCE(v_status, 'none');
END;
$$;

-- request_community_join: skip for owners/members; notify tenant owners
CREATE OR REPLACE FUNCTION public.request_community_join(p_tenant_id UUID)
RETURNS TABLE(id UUID, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_membership_id UUID;
  v_existing_status TEXT;
  v_user_email TEXT;
  v_user_name TEXT;
  v_owner RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'User must be authenticated'; END IF;

  IF EXISTS (SELECT 1 FROM public.memberships WHERE user_id = v_user_id AND tenant_id = p_tenant_id) THEN
    INSERT INTO public.community_members (user_id, tenant_id, status, approved_at)
    VALUES (v_user_id, p_tenant_id, 'approved', now())
    ON CONFLICT (user_id, tenant_id) DO UPDATE
      SET status = 'approved',
          approved_at = COALESCE(public.community_members.approved_at, now())
    RETURNING community_members.id INTO v_membership_id;
    RETURN QUERY SELECT v_membership_id, 'approved'::TEXT;
    RETURN;
  END IF;

  SELECT cm.id, cm.status INTO v_membership_id, v_existing_status
    FROM public.community_members cm
   WHERE cm.user_id = v_user_id AND cm.tenant_id = p_tenant_id;

  IF v_membership_id IS NOT NULL THEN
    IF v_existing_status = 'approved' THEN
      RETURN QUERY SELECT v_membership_id, 'approved'::TEXT;
      RETURN;
    END IF;
    UPDATE public.community_members
       SET status = 'pending', approved_at = NULL
     WHERE id = v_membership_id;
  ELSE
    INSERT INTO public.community_members (user_id, tenant_id, status)
    VALUES (v_user_id, p_tenant_id, 'pending')
    RETURNING id INTO v_membership_id;
  END IF;

  SELECT u.email::text, COALESCE(p.name, split_part(u.email,'@',1))::text
    INTO v_user_email, v_user_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
   WHERE u.id = v_user_id;

  FOR v_owner IN
    SELECT user_id FROM public.memberships
     WHERE tenant_id = p_tenant_id AND role IN ('owner','admin')
  LOOP
    INSERT INTO public.notifications (tenant_id, user_id, type, title, body, priority, data)
    VALUES (
      p_tenant_id, v_owner.user_id, 'access_request',
      'Nova solicitação de acesso',
      COALESCE(v_user_name, v_user_email) || ' solicitou entrada na comunidade',
      'high',
      jsonb_build_object(
        'membership_id', v_membership_id,
        'requester_id', v_user_id,
        'user_name', v_user_name,
        'user_email', v_user_email
      )
    );
  END LOOP;

  RETURN QUERY SELECT v_membership_id, 'pending'::TEXT;
END;
$$;

-- approve / reject (recreated for safety)
CREATE OR REPLACE FUNCTION public.approve_community_member(p_membership_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.community_members WHERE id = p_membership_id;
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Membership not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.memberships
    WHERE tenant_id = v_tenant_id AND user_id = auth.uid() AND role IN ('owner','admin')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.community_members SET status='approved', approved_at=now() WHERE id = p_membership_id;
  RETURN TRUE;
END; $$;

CREATE OR REPLACE FUNCTION public.reject_community_member(p_membership_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.community_members WHERE id = p_membership_id;
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Membership not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.memberships
    WHERE tenant_id = v_tenant_id AND user_id = auth.uid() AND role IN ('owner','admin')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.community_members SET status='rejected', approved_at=NULL WHERE id = p_membership_id;
  RETURN TRUE;
END; $$;

CREATE OR REPLACE FUNCTION public.get_pending_members(p_tenant_id UUID)
RETURNS TABLE(id UUID, user_id UUID, tenant_id UUID, status TEXT, created_at TIMESTAMPTZ, user_email TEXT, user_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role IN ('owner','admin')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT cm.id, cm.user_id, cm.tenant_id, cm.status, cm.created_at,
           u.email::TEXT, p.name::TEXT
      FROM public.community_members cm
      JOIN auth.users u ON u.id = cm.user_id
      LEFT JOIN public.profiles p ON p.user_id = cm.user_id
     WHERE cm.tenant_id = p_tenant_id AND cm.status = 'pending'
     ORDER BY cm.created_at DESC;
END; $$;

-- Backfill: existing tenant owners/members are approved
INSERT INTO public.community_members (user_id, tenant_id, status, approved_at)
SELECT m.user_id, m.tenant_id, 'approved', now()
  FROM public.memberships m
ON CONFLICT (user_id, tenant_id) DO UPDATE
  SET status = 'approved',
      approved_at = COALESCE(public.community_members.approved_at, now());