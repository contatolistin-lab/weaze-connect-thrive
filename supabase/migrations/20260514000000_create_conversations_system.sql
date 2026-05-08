-- =============================================
-- CONVERSATIONS SYSTEM - COMPLETE ARCHITECTURE
-- =============================================

-- =============================================
-- 1. HELPER FUNCTIONS
-- =============================================

-- Check if user is a member (approved) of a tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member_check(user_uuid UUID, tenant_uuid UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = user_uuid
      AND m.tenant_id = tenant_uuid
      AND m.status = 'approved'
  );
END;
$$;

-- Check if user is owner/admin of a tenant
CREATE OR REPLACE FUNCTION public.is_tenant_admin_check(user_uuid UUID, tenant_uuid UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = user_uuid
      AND m.tenant_id = tenant_uuid
      AND m.status = 'approved'
      AND m.role IN ('owner', 'admin')
  );
END;
$$;

-- =============================================
-- 2. CONVERSATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'internal')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  archived BOOLEAN DEFAULT false,
  max_pins INTEGER DEFAULT 3,
  CONSTRAINT unique_conversation_title_per_tenant UNIQUE (tenant_id, title)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_conversations_tenant ON public.conversations(tenant_id);
CREATE INDEX idx_conversations_visibility ON public.conversations(visibility);
CREATE INDEX idx_conversations_archived ON public.conversations(archived);
CREATE INDEX idx_conversations_updated ON public.conversations(updated_at DESC);

-- RLS Policies for conversations
DROP POLICY IF EXISTS "read conversations" ON public.conversations;
CREATE POLICY "read conversations" ON public.conversations FOR SELECT USING (
  archived = false AND (
    visibility = 'public' AND public.is_tenant_member_check(auth.uid(), tenant_id)
    OR visibility = 'internal' AND public.is_tenant_admin_check(auth.uid(), tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = id AND cm.user_id = auth.uid()
    )
    OR public.is_tenant_admin_check(auth.uid(), tenant_id)
  )
);

DROP POLICY IF EXISTS "insert conversations" ON public.conversations;
CREATE POLICY "insert conversations" ON public.conversations FOR INSERT WITH CHECK (
  public.is_tenant_admin_check(auth.uid(), tenant_id)
);

DROP POLICY IF EXISTS "update conversations" ON public.conversations;
CREATE POLICY "update conversations" ON public.conversations FOR UPDATE USING (
  public.is_tenant_admin_check(auth.uid(), tenant_id)
  OR (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = id
        AND cm.user_id = auth.uid()
        AND cm.role = 'owner'
    )
    AND (archived IS NOT DISTINCT FROM false)
  )
);

DROP POLICY IF EXISTS "delete conversations" ON public.conversations;
CREATE POLICY "delete conversations" ON public.conversations FOR DELETE USING (
  public.is_tenant_admin_check(auth.uid(), tenant_id)
);

-- =============================================
-- 3. CONVERSATION MEMBERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_member_per_conversation UNIQUE (conversation_id, user_id)
);

ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_conversation_members_conversation ON public.conversation_members(conversation_id);
CREATE INDEX idx_conversation_members_user ON public.conversation_members(user_id);

-- RLS Policies for conversation_members
DROP POLICY IF EXISTS "read conversation_members" ON public.conversation_members;
CREATE POLICY "read conversation_members" ON public.conversation_members FOR SELECT USING (
  public.is_tenant_admin_check(auth.uid(), tenant_id)
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND (
        c.visibility = 'public' AND public.is_tenant_member_check(auth.uid(), c.tenant_id)
        OR EXISTS (
          SELECT 1 FROM public.conversation_members cm2
          WHERE cm2.conversation_id = c.id AND cm2.user_id = auth.uid()
        )
      )
  )
);

DROP POLICY IF EXISTS "insert conversation_members" ON public.conversation_members;
CREATE POLICY "insert conversation_members" ON public.conversation_members FOR INSERT WITH CHECK (
  public.is_tenant_admin_check(auth.uid(), tenant_id)
  OR (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.conversation_members cm_adder ON cm_adder.conversation_id = c.id AND cm_adder.user_id = auth.uid()
      WHERE c.id = conversation_id
        AND c.visibility = 'private'
        AND cm_adder.role IN ('owner', 'moderator')
    )
  )
);

DROP POLICY IF EXISTS "update conversation_members" ON public.conversation_members;
CREATE POLICY "update conversation_members" ON public.conversation_members FOR UPDATE USING (
  public.is_tenant_admin_check(auth.uid(), tenant_id)
);

DROP POLICY IF EXISTS "delete conversation_members" ON public.conversation_members;
CREATE POLICY "delete conversation_members" ON public.conversation_members FOR DELETE USING (
  public.is_tenant_admin_check(auth.uid(), tenant_id)
);

-- =============================================
-- 4. CONVERSATION MESSAGES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 10000),
  reply_to UUID REFERENCES public.conversation_messages(id) ON DELETE SET NULL,
  pinned BOOLEAN DEFAULT false,
  pinned_at TIMESTAMPTZ,
  pinned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted BOOLEAN DEFAULT false
);

ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_conversation_messages_conversation ON public.conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_user ON public.conversation_messages(user_id);
CREATE INDEX idx_conversation_messages_pinned ON public.conversation_messages(conversation_id) WHERE pinned = true;
CREATE INDEX idx_conversation_messages_created ON public.conversation_messages(created_at);
CREATE INDEX idx_conversation_messages_reply ON public.conversation_messages(reply_to);

-- RLS Policies for conversation_messages
DROP POLICY IF EXISTS "read conversation_messages" ON public.conversation_messages;
CREATE POLICY "read conversation_messages" ON public.conversation_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND (
        public.is_tenant_admin_check(auth.uid(), c.tenant_id)
        OR c.visibility = 'public' AND public.is_tenant_member_check(auth.uid(), c.tenant_id)
        OR c.visibility = 'internal' AND public.is_tenant_admin_check(auth.uid(), c.tenant_id)
        OR EXISTS (
          SELECT 1 FROM public.conversation_members cm
          WHERE cm.conversation_id = c.id AND cm.user_id = auth.uid()
        )
      )
  )
);

DROP POLICY IF EXISTS "insert conversation_messages" ON public.conversation_messages;
CREATE POLICY "insert conversation_messages" FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND c.archived = false
      AND (
        public.is_tenant_admin_check(auth.uid(), c.tenant_id)
        OR c.visibility = 'public' AND public.is_tenant_member_check(auth.uid(), c.tenant_id)
        OR c.visibility = 'internal' AND public.is_tenant_admin_check(auth.uid(), c.tenant_id)
        OR EXISTS (
          SELECT 1 FROM public.conversation_members cm
          WHERE cm.conversation_id = c.id AND cm.user_id = auth.uid()
        )
      )
  )
);

DROP POLICY IF EXISTS "update conversation_messages" ON public.conversation_messages;
CREATE POLICY "update conversation_messages" ON public.conversation_messages FOR UPDATE USING (
  auth.uid() = user_id
  OR auth.uid() = pinned_by
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = auth.uid()
    WHERE c.id = conversation_id AND cm.role IN ('owner', 'moderator')
  )
  OR public.is_tenant_admin_check(auth.uid(), tenant_id)
);

DROP POLICY IF EXISTS "delete conversation_messages" ON public.conversation_messages;
CREATE POLICY "delete conversation_messages" ON public.conversation_messages FOR DELETE USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = auth.uid()
    WHERE c.id = conversation_id AND cm.role IN ('owner', 'moderator')
  )
  OR public.is_tenant_admin_check(auth.uid(), tenant_id)
);

-- =============================================
-- 5. SECURITY/HELPER FUNCTIONS FOR CONVERSATIONS
-- =============================================

-- Check if user is a member of a specific conversation
CREATE OR REPLACE FUNCTION public.is_conversation_member_check(user_uuid UUID, conv_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  conv_tenant UUID;
BEGIN
  SELECT tenant_id INTO conv_tenant FROM public.conversations WHERE id = conv_id;

  IF conv_tenant IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conv_id AND cm.user_id = user_uuid
  )
  OR public.is_tenant_admin_check(user_uuid, conv_tenant)
  OR (
    SELECT visibility FROM public.conversations WHERE id = conv_id
  ) = 'public' AND public.is_tenant_member_check(user_uuid, conv_tenant);
END;
$$;

-- Check if user is owner of a specific conversation
CREATE OR REPLACE FUNCTION public.is_conversation_owner_check(user_uuid UUID, conv_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conv_id
      AND cm.user_id = user_uuid
      AND cm.role = 'owner'
  );
END;
$$;

-- Check if user can moderate a specific conversation
CREATE OR REPLACE FUNCTION public.can_moderate_conversation_check(user_uuid UUID, conv_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  conv_tenant UUID;
BEGIN
  SELECT tenant_id INTO conv_tenant FROM public.conversations WHERE id = conv_id;

  IF conv_tenant IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conv_id
      AND cm.user_id = user_uuid
      AND cm.role IN ('owner', 'moderator')
  )
  OR public.is_tenant_admin_check(user_uuid, conv_tenant);
END;
$$;

-- Check if user can pin messages in a conversation (moderator+ or tenant admin)
CREATE OR REPLACE FUNCTION public.can_pin_message_check(user_uuid UUID, conv_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  conv_tenant UUID;
BEGIN
  SELECT tenant_id INTO conv_tenant FROM public.conversations WHERE id = conv_id;

  IF conv_tenant IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conv_id
      AND cm.user_id = user_uuid
      AND cm.role IN ('owner', 'moderator')
  )
  OR public.is_tenant_admin_check(user_uuid, conv_tenant);
END;
$$;

-- Get member count for a conversation
CREATE OR REPLACE FUNCTION public.get_conversation_member_count(conv_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.conversation_members cm
    WHERE cm.conversation_id = conv_id
  );
END;
$$;

-- Check pin limit (max 3 pins per conversation)
CREATE OR REPLACE FUNCTION public.can_add_pin_check(conv_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  max_p INTEGER;
  current_pins INTEGER;
BEGIN
  SELECT COALESCE(max_pins, 3) INTO max_p FROM public.conversations WHERE id = conv_id;
  SELECT COUNT(*) INTO current_pins FROM public.conversation_messages WHERE conversation_id = conv_id AND pinned = true;
  RETURN current_pins < max_p;
END;
$$;

-- =============================================
-- 6. TRIGGERS
-- =============================================

-- Auto-update conversations.updated_at
CREATE OR REPLACE FUNCTION public.update_conversation_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_conversation_message_insert
AFTER INSERT ON public.conversation_messages
FOR EACH ROW
WHEN (NEW.deleted = false)
EXECUTE FUNCTION public.update_conversation_activity();

-- Update conversation.updated_at on member changes
CREATE OR REPLACE FUNCTION public.update_conversation_on_member_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.conversations SET updated_at = now() WHERE id = COALESCE(NEW.conversation_id, OLD.conversation_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER trigger_conversation_member_change
AFTER INSERT OR UPDATE OR DELETE ON public.conversation_members
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_on_member_change();

-- =============================================
-- 7. SEED DEFAULT CONVERSATION (OPTIONAL)
-- =============================================

-- Function to create a default "Geral" conversation for a tenant
CREATE OR REPLACE FUNCTION public.create_default_conversation(p_tenant_id UUID, p_created_by UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- Check if "Geral" already exists
  SELECT id INTO conv_id FROM public.conversations WHERE tenant_id = p_tenant_id AND title = 'Geral';
  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  -- Create the conversation
  INSERT INTO public.conversations (tenant_id, title, description, visibility, created_by)
  VALUES (p_tenant_id, 'Geral', 'Conversa geral da comunidade', 'public', p_created_by)
  RETURNING id INTO conv_id;

  -- Add creator as owner
  INSERT INTO public.conversation_members (conversation_id, user_id, role, added_by)
  VALUES (conv_id, p_created_by, 'owner', p_created_by);

  RETURN conv_id;
END;
$$;

-- =============================================
-- 8. REALTIME (enabled via publication)
-- =============================================

-- Enable realtime for conversations tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;

COMMENT ON TABLE public.conversations IS 'Stores conversation/group metadata per tenant';
COMMENT ON TABLE public.conversation_members IS 'Maps users to conversations with scoped roles';
COMMENT ON TABLE public.conversation_messages IS 'Individual messages within conversations';
COMMENT ON COLUMN public.conversations.visibility IS 'public: all approved members, private: invited only, internal: brand team only';
COMMENT ON COLUMN public.conversation_members.role IS 'Scoped role - owner/moderator/member applies ONLY to this conversation, not global';
COMMENT ON COLUMN public.conversation_messages.pinned IS 'Pinned messages appear at top, max 3 per conversation';
