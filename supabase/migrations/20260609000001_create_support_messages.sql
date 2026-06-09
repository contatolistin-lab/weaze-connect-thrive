-- Create support_messages table for B2C support requests
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL DEFAULT '',
  user_email TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('duvida', 'sugestao', 'problema')),
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'respondido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_support_messages_tenant ON support_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_user ON support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON support_messages(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_type ON support_messages(type);

-- RLS Policies
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- B2B admins can view messages for their tenant
CREATE POLICY "B2B can view support messages for their tenant" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = support_messages.tenant_id
        AND memberships.user_id = auth.uid()
        AND memberships.role IN ('owner', 'admin')
    )
  );

-- Users can view their own messages
CREATE POLICY "Users can view their own support messages" ON support_messages
  FOR SELECT USING (user_id = auth.uid());

-- Anyone can insert their own support message
CREATE POLICY "Users can create their own support messages" ON support_messages
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Only B2B owners/admins can update message status
CREATE POLICY "B2B can update support messages for their tenant" ON support_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = support_messages.tenant_id
        AND memberships.user_id = auth.uid()
        AND memberships.role IN ('owner', 'admin')
    )
  );

-- Enable realtime for instant sync
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
