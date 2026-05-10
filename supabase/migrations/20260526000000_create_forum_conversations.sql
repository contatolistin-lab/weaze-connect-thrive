-- Forum Conversations System
-- Simple forum structure for community discussions

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations_forum (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  replies_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Replies table
CREATE TABLE IF NOT EXISTS conversation_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations_forum(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_to_id UUID REFERENCES conversation_replies(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_forum_tenant ON conversations_forum(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_forum_last_reply ON conversations_forum(last_reply_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversations_forum_created ON conversations_forum(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_replies_conversation ON conversation_replies(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_replies_created ON conversation_replies(created_at);

-- RLS
ALTER TABLE conversations_forum ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_replies ENABLE ROW LEVEL SECURITY;

-- Members can view conversations
CREATE POLICY "Members can view conversations" ON conversations_forum
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = conversations_forum.tenant_id
      AND memberships.user_id = auth.uid()
    )
  );

-- B2B users can create conversations
CREATE POLICY "B2B users can create conversations" ON conversations_forum
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = conversations_forum.tenant_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

-- B2B owners can delete conversations
CREATE POLICY "B2B owners can delete conversations" ON conversations_forum
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = conversations_forum.tenant_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

-- Members can view replies
CREATE POLICY "Members can view replies" ON conversation_replies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN conversations_forum c ON c.tenant_id = m.tenant_id
      WHERE c.id = conversation_replies.conversation_id
      AND m.user_id = auth.uid()
    )
  );

-- Members can create replies
CREATE POLICY "Members can create replies" ON conversation_replies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN conversations_forum c ON c.tenant_id = m.tenant_id
      WHERE c.id = conversation_replies.conversation_id
      AND m.user_id = auth.uid()
    )
  );

-- Users can update their own replies
CREATE POLICY "Users can update own replies" ON conversation_replies
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own replies
CREATE POLICY "Users can delete own replies" ON conversation_replies
  FOR DELETE USING (user_id = auth.uid());

-- Function to increment replies count
CREATE OR REPLACE FUNCTION increment_replies_count(conv_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE conversations_forum
  SET replies_count = replies_count + 1,
      last_reply_at = now(),
      updated_at = now()
  WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement replies count
CREATE OR REPLACE FUNCTION decrement_replies_count(conv_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE conversations_forum
  SET replies_count = GREATEST(0, replies_count - 1),
      updated_at = now()
  WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;