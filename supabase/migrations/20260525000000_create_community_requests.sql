-- Create community_requests table for B2C membership requests
CREATE TABLE IF NOT EXISTS community_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_community_requests_tenant ON community_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_community_requests_user ON community_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_community_requests_status ON community_requests(status);

-- RLS Policies
ALTER TABLE community_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can read requests for their own tenant (for B2B owners/admins)
CREATE POLICY "B2B can view requests for their tenant" ON community_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = community_requests.tenant_id
        AND memberships.user_id = auth.uid()
        AND memberships.role IN ('owner', 'admin')
    )
  );

-- Users can view their own requests
CREATE POLICY "Users can view their own requests" ON community_requests
  FOR SELECT USING (user_id = auth.uid());

-- Anyone can insert their own requests
CREATE POLICY "Users can create their own requests" ON community_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Only B2B owners/admins can update requests
CREATE POLICY "B2B can update requests for their tenant" ON community_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = community_requests.tenant_id
        AND memberships.user_id = auth.uid()
        AND memberships.role IN ('owner', 'admin')
    )
  );

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE community_requests;