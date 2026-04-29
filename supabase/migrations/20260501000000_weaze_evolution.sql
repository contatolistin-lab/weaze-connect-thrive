-- Weaze Evolution: Continuous Relationship Platform
-- Migration: Add topics, interactions enhancement, notifications priority, insights, events, onboarding

-- ============ TOPICS (Discussion linked to posts) ============
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  related_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  replies_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_topics_tenant ON public.topics(tenant_id, last_activity_at DESC);
CREATE INDEX idx_topics_post ON public.topics(related_post_id);

CREATE POLICY "topics_select_all" ON public.topics FOR SELECT USING (true);
CREATE POLICY "topics_insert_member" ON public.topics FOR INSERT WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "topics_update_owner" ON public.topics FOR UPDATE USING (public.is_tenant_owner(auth.uid(), tenant_id) OR created_by = auth.uid());
CREATE POLICY "topics_delete_owner" ON public.topics FOR DELETE USING (public.is_tenant_owner(auth.uid(), tenant_id));

-- ============ TOPIC MESSAGES ============
CREATE TABLE public.topic_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.topic_messages(id),
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.topic_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_topic_messages_topic ON public.topic_messages(topic_id, created_at DESC);
CREATE INDEX idx_topic_messages_parent ON public.topic_messages(parent_id);

CREATE POLICY "topic_messages_select_all" ON public.topic_messages FOR SELECT USING (true);
CREATE POLICY "topic_messages_insert_auth" ON public.topic_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "topic_messages_update_own" ON public.topic_messages FOR UPDATE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.topics t WHERE t.id = topic_id AND public.is_tenant_owner(auth.uid(), t.tenant_id)));
CREATE POLICY "topic_messages_delete_own" ON public.topic_messages FOR DELETE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.topics t WHERE t.id = topic_id AND public.is_tenant_owner(auth.uid(), t.tenant_id)));

-- Trigger to update topics.replies_count and last_activity_at
CREATE OR REPLACE FUNCTION public.update_topic_reply_count()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.topics 
    SET replies_count = replies_count + 1,
        last_activity_at = now()
    WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.topics 
    SET replies_count = replies_count - 1,
        last_activity_at = now()
    WHERE id = OLD.topic_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_topic_reply_count AFTER INSERT OR DELETE ON public.topic_messages
FOR EACH ROW EXECUTE FUNCTION public.update_topic_reply_count();

-- ============ POSTS: Add discussion/interaction fields ============
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS discussion_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS interaction_prompt TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS pre_live_discussion_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_live BOOLEAN NOT NULL DEFAULT FALSE;

-- ============ COMMUNITY EVENTS ============
CREATE TABLE public.community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_community_events_tenant ON public.community_events(tenant_id, start_at DESC);
CREATE INDEX idx_community_events_active ON public.community_events(start_at, end_at) WHERE is_active = TRUE;

CREATE POLICY "community_events_select_all" ON public.community_events FOR SELECT USING (true);
CREATE POLICY "community_events_insert_owner" ON public.community_events FOR INSERT WITH CHECK (public.is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "community_events_update_owner" ON public.community_events FOR UPDATE USING (public.is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "community_events_delete_owner" ON public.community_events FOR DELETE USING (public.is_tenant_owner(auth.uid(), tenant_id));

-- ============ INSIGHTS CACHE ============
CREATE TABLE public.insights_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insights_cache ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_insights_cache_tenant ON public.insights_cache(tenant_id, created_at DESC);

CREATE POLICY "insights_cache_select_owner" ON public.insights_cache FOR SELECT
  USING (public.is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "insights_cache_insert_owner" ON public.insights_cache FOR INSERT WITH CHECK (public.is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "insights_cache_update_owner" ON public.insights_cache FOR UPDATE USING (public.is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "insights_cache_delete_owner" ON public.insights_cache FOR DELETE USING (public.is_tenant_owner(auth.uid(), tenant_id));

-- ============ ONBOARDING STATE ============
CREATE TABLE public.onboarding_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  step INTEGER NOT NULL DEFAULT 1,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  viewed_posts JSONB DEFAULT '[]'::jsonb,
  first_cta_clicked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_state ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_onboarding_state_user ON public.onboarding_state(tenant_id, user_id);

CREATE POLICY "onboarding_state_select_own" ON public.onboarding_state FOR SELECT
  USING (auth.uid() = user_id OR public.is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "onboarding_state_insert_own" ON public.onboarding_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "onboarding_state_update_own" ON public.onboarding_state FOR UPDATE USING (auth.uid() = user_id OR public.is_tenant_owner(auth.uid(), tenant_id));

-- ============ NOTIFICATIONS PRIORITY ============
-- Note: notifications table should already exist; add priority field if not present
-- ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';
-- Values: 'high', 'medium', 'low'

-- Function to compute topic score for ranking
CREATE OR REPLACE FUNCTION public.compute_topic_score(topic_id UUID)
RETURNS numeric LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_replies numeric;
  v_likes numeric;
  v_age numeric;
BEGIN
  SELECT COALESCE(replies_count, 0), COALESCE((SELECT count(*)::numeric FROM public.topic_messages tm WHERE tm.topic_id = topics.id AND tm.likes_count > 0), 0)
  INTO v_replies, v_likes
  FROM public.topics WHERE id = topic_id;
  
  v_age := EXTRACT(EPOCH FROM (now() - last_activity_at)) / 3600;
  
  RETURN (v_replies * 2) + v_likes + (100 / (v_age + 2));
END; $$;