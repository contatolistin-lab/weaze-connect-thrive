-- Gamification Tables for Community Commerce Hub
CREATE TABLE IF NOT EXISTS user_engagement_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  monthly_points INTEGER NOT NULL DEFAULT 0,
  yearly_points INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_uep_ut ON user_engagement_points(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_uep_monthly ON user_engagement_points(tenant_id, monthly_points DESC);
CREATE INDEX IF NOT EXISTS idx_uep_yearly ON user_engagement_points(tenant_id, yearly_points DESC);
ALTER TABLE user_engagement_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uep_select" ON user_engagement_points FOR SELECT USING (true);
CREATE POLICY "uep_all" ON user_engagement_points FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS engagement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  reference_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_el_utc ON engagement_logs(user_id, tenant_id, created_at);
ALTER TABLE engagement_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "el_select" ON engagement_logs FOR SELECT USING (true);
CREATE POLICY "el_insert" ON engagement_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "el_all" ON engagement_logs FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS tenant_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  award_type TEXT DEFAULT 'discount',
  award_value TEXT,
  min_position INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE tenant_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tr_select" ON tenant_rewards FOR SELECT USING (true);
CREATE POLICY "tr_manage" ON tenant_rewards FOR ALL USING (true);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil';
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_loc_update" ON profiles;
CREATE POLICY "profiles_loc_update" ON profiles FOR UPDATE USING (auth.uid() = user_oid);

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cta_min_points INTEGER DEFAULT 2;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cta_max_points INTEGER DEFAULT 5;

CREATE OR REPLACE FUNCTION award_engagement_points(
  p_user_id UUID,
  p_tenant_id UUID,
  p_action_type TEXT,
  p_points INTEGER,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_points IS NULL OR p_points <= 0 THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM engagement_logs WHERE user_id = p_user_id AND tenant_id = p_tenant_id AND action_type = p_action_type AND reference_id IS NOT DISTINCT FROM p_reference_id LIMIT 1) THEN RETURN; END IF;
  INSERT INTO engagement_logs (user_id, tenant_id, action_type, points, reference_id, metadata)
  VALUES (p_user_id, p_tenant_id, p_action_type, p_points, p_reference_id, p_metadata) ON CONFLICT DO NOTHING;
  INSERT INTO user_engagement_points (user_id, tenant_id, total_points, monthly_points, yearly_points, last_updated_at)
  VALUES (p_user_id, p_tenant_id, p_points, p_points, p_points, now())
  ON CONFLICT (user_id, tenant_id) DO UPDATE SET
    total_points = user_engagement_points.total_points + p_points,
    monthly_points = user_engagement_points.monthly_points + p_points,
    yearly_points = user_engagement_points.yearly_points + p_points,
    last_updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION get_monthly_ranking(p_tenant_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(rank INTEGER, user_id UUID, name TEXT, avatar_urL TEXT, city TEXT, state TEXT, monthly_points INTEGER)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT ROW_NUMBER() OVER (ORDER BY uep.monthly_points DESC)::INTEGER AS rank,
    uep.user_id, COALESCE(p.name, 'Usuário')::TEXT, p.avatar_url, p.city, p.state, uep.monthly_points
  FROM user_engagement_points uep LEFT JOIN profiles p ON p.user_id = uep.user_id
  WHERE uep.tenant_id = p_tenant_id AND uep.monthly_points > 0
  ORDER BY uep.monthly_points DESC LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION get_yearly_ranking(p_tenant_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(rank INTEGER, user_id UUID, name TEXT, avatar_url TEXT, city TEXT, state TEXT, yearly_points INTEGER)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT ROW_NUMBER() OVER (ORDER BY uep.yearly_points DESC)::INTEGER AS rank,
    uep.user_id, COALESCE(p.name, 'Usuário')::TEXT, p.avatar_url, p.city, p.state, uep.yearly_points
  FROM user_engagement_points uep LEFT JOIN profiles p ON p.user_id = uep.user_id
  WHERE uep.tenant_id = p_tenant_id AND uep.yearly_points > 0
  ORDER BY uep.yearly_points DESC LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_engagement_stats(p_user_id UUID, p_tenant_id UUID)
RETURNS TABLE(total_points INTEGER, monthly_points INTEGER, yearly_points INTEGER, monthly_rank INTEGER, yearly_rank INTEGER)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT uep.total_points, uep.monthly_points, uep.yearly_points,
    (SELECT COUNT(*)+1 FROM user_engagement_points WHERE tenant_id = p_tenant_id AND monthly_points > uep.monthly_points)::INTEGER,
    (SELECT COUNT(*)+1 FROM user_engagement_points WHERE tenant_id = p_tenant_id AND yearly_points > uep.yearly_points)::INTEGER
  FROM user_engagement_points uep WHERE uep.user_id = p_user_id AND uep.tenant_id = p_tenant_id;
END;
$$;