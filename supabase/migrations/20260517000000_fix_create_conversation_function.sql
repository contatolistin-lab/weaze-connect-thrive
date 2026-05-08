-- =============================================
-- FIX ALL RLS - drop dependent policies first, then functions
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop dependent policies FIRST
DROP POLICY IF EXISTS conv_messages_select ON public.conversation_messages;
DROP POLICY IF EXISTS conv_messages_insert ON public.conversation_messages;
DROP POLICY IF EXISTS conv_pins_select ON public.conversation_message_pins;
DROP POLICY IF EXISTS conversations_select ON public.conversations;
DROP POLICY IF EXISTS conversations_insert ON public.conversations;
DROP POLICY IF EXISTS conv_members_select ON public.conversation_members;
DROP POLICY IF EXISTS conv_members_insert ON public.conversation_members;

-- Drop functions (now no dependencies)
DROP FUNCTION IF EXISTS public.is_tenant_member_check(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_tenant_admin_check(UUID, UUID);

-- Recreate is_tenant_member_check (no m.status column)
CREATE OR REPLACE FUNCTION public.is_tenant_member_check(p_user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM public.memberships m WHERE m.user_id = p_user_id AND m.tenant_id = p_tenant_id); END;
$$;

-- Recreate is_tenant_admin_check
CREATE OR REPLACE FUNCTION public.is_tenant_admin_check(p_user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM public.memberships m WHERE m.user_id = p_user_id AND m.tenant_id = p_tenant_id AND m.role IN ('owner','admin')); END;
$$;

-- Recreate get_user_tenant_role
DROP FUNCTION IF EXISTS public.get_user_tenant_role(UUID, UUID);
CREATE OR REPLACE FUNCTION public.get_user_tenant_role(p_user_id UUID, p_tenant_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_role TEXT;
BEGIN SELECT m.role INTO v_role FROM public.memberships m WHERE m.user_id = p_user_id AND m.tenant_id = p_tenant_id LIMIT 1; RETURN COALESCE(v_role, 'none');
END;
$$;

-- Drop and recreate create_conversation - returns FULL conversation object
DROP FUNCTION IF EXISTS public.create_conversation(UUID, TEXT, TEXT, TEXT, UUID);
CREATE OR REPLACE FUNCTION public.create_conversation(
  p_tenant_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_visibility TEXT,
  p_created_by UUID
)
RETURNS public.conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.conversations;
  v_user_role TEXT;
BEGIN
  -- Verify user is a member of the tenant (no status column)
  v_user_role := public.get_user_tenant_role(p_created_by, p_tenant_id);

  IF v_user_role = 'none' THEN
    RAISE EXCEPTION 'User is not a member of this tenant';
  END IF;

  -- Internal conversations only for admin/owner
  IF p_visibility = 'internal' AND v_user_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only admins can create internal conversations';
  END IF;

  -- Validate visibility
  IF p_visibility NOT IN ('public', 'private', 'internal') THEN
    RAISE EXCEPTION 'Invalid visibility value: %', p_visibility;
  END IF;

  -- Insert the conversation
  INSERT INTO public.conversations (tenant_id, title, description, visibility, created_by)
  VALUES (p_tenant_id, p_title, p_description, p_visibility, p_created_by)
  RETURNING * INTO v_conv;

  -- Automatically add creator as owner
  INSERT INTO public.conversation_members (conversation_id, user_id, role, added_by)
  VALUES (v_conv.id, p_created_by, 'owner', p_created_by);

  -- Return the full conversation object
  RETURN v_conv;
END;
$$;

-- =============================================
-- FIX RLS POLICIES (the root cause of empty list)
-- =============================================

-- conversations SELECT: member of tenant OR member of conversation
DROP POLICY IF EXISTS conversations_select ON public.conversations;
CREATE POLICY conversations_select ON public.conversations FOR SELECT USING (
  archived = false
  AND (
    public.is_tenant_member_check(auth.uid(), tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = id AND cm.user_id = auth.uid()
    )
  )
);

-- conversations INSERT: member of tenant (function handles role restrictions)
DROP POLICY IF EXISTS conversations_insert ON public.conversations;
CREATE POLICY conversations_insert ON public.conversations FOR INSERT WITH CHECK (
  public.is_tenant_member_check(auth.uid(), tenant_id)
);

-- conversation_members SELECT: member of tenant OR member of conversation
DROP POLICY IF EXISTS conv_members_select ON public.conversation_members;
CREATE POLICY conv_members_select ON public.conversation_members FOR SELECT USING (
  public.is_tenant_member_check(auth.uid(),
    (SELECT tenant_id FROM public.conversations WHERE id = conversation_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.conversation_members cm2
    WHERE cm2.conversation_id = conversation_id AND cm2.user_id = auth.uid()
  )
);

-- conversation_members INSERT: member of conversation
DROP POLICY IF EXISTS conv_members_insert ON public.conversation_members;
CREATE POLICY conv_members_insert ON public.conversation_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'moderator')
  )
);

-- conversation_messages SELECT
DROP POLICY IF EXISTS conv_messages_select ON public.conversation_messages;
CREATE POLICY conv_messages_select ON public.conversation_messages FOR SELECT USING (
  public.is_tenant_member_check(auth.uid(),
    (SELECT tenant_id FROM public.conversations WHERE id = conversation_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
  )
);

-- Verify all
SELECT proname, proargnames FROM pg_proc
WHERE proname IN ('create_conversation', 'get_user_tenant_role', 'is_tenant_member_check', 'is_tenant_admin_check')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT policyname, cmd FROM pg_policies WHERE tablename IN ('conversations', 'conversation_members', 'conversation_messages');
