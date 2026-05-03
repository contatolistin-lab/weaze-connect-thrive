
-- Award engagement points
CREATE OR REPLACE FUNCTION public.award_engagement_points(
  p_user_id uuid, p_tenant_id uuid, p_action_type text, p_points integer,
  p_reference_id uuid DEFAULT NULL, p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.engagement_logs (user_id, tenant_id, action_type, points, reference_id, metadata)
  VALUES (p_user_id, p_tenant_id, p_action_type, p_points, p_reference_id, p_metadata);

  INSERT INTO public.user_engagement_points (user_id, tenant_id, total_points, monthly_points, yearly_points, last_updated_at)
  VALUES (p_user_id, p_tenant_id, p_points, p_points, p_points, now())
  ON CONFLICT (user_id, tenant_id) DO UPDATE SET
    total_points = public.user_engagement_points.total_points + EXCLUDED.total_points,
    monthly_points = public.user_engagement_points.monthly_points + EXCLUDED.monthly_points,
    yearly_points = public.user_engagement_points.yearly_points + EXCLUDED.yearly_points,
    last_updated_at = now();
END; $$;

-- Unique constraint required for upsert
DO $$ BEGIN
  ALTER TABLE public.user_engagement_points ADD CONSTRAINT user_engagement_points_user_tenant_unique UNIQUE (user_id, tenant_id);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

-- Monthly ranking
CREATE OR REPLACE FUNCTION public.get_monthly_ranking(p_tenant_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(rank bigint, user_id uuid, name text, avatar_url text, city text, state text, monthly_points integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT row_number() OVER (ORDER BY uep.monthly_points DESC) AS rank,
    uep.user_id, p.name, p.avatar_url, p.city, p.state, uep.monthly_points
  FROM public.user_engagement_points uep
  LEFT JOIN public.profiles p ON p.user_id = uep.user_id
  WHERE uep.tenant_id = p_tenant_id AND uep.monthly_points > 0
  ORDER BY uep.monthly_points DESC
  LIMIT p_limit;
$$;

-- Yearly ranking
CREATE OR REPLACE FUNCTION public.get_yearly_ranking(p_tenant_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(rank bigint, user_id uuid, name text, avatar_url text, city text, state text, yearly_points integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT row_number() OVER (ORDER BY uep.yearly_points DESC) AS rank,
    uep.user_id, p.name, p.avatar_url, p.city, p.state, uep.yearly_points
  FROM public.user_engagement_points uep
  LEFT JOIN public.profiles p ON p.user_id = uep.user_id
  WHERE uep.tenant_id = p_tenant_id AND uep.yearly_points > 0
  ORDER BY uep.yearly_points DESC
  LIMIT p_limit;
$$;

-- User stats
CREATE OR REPLACE FUNCTION public.get_user_engagement_stats(p_user_id uuid, p_tenant_id uuid)
RETURNS TABLE(total_points integer, monthly_points integer, yearly_points integer, monthly_rank bigint, yearly_rank bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH ranked AS (
    SELECT user_id, total_points, monthly_points, yearly_points,
      row_number() OVER (ORDER BY monthly_points DESC) AS m_rank,
      row_number() OVER (ORDER BY yearly_points DESC) AS y_rank
    FROM public.user_engagement_points WHERE tenant_id = p_tenant_id
  )
  SELECT total_points, monthly_points, yearly_points, m_rank, y_rank
  FROM ranked WHERE user_id = p_user_id;
$$;

-- RLS for engagement tables
ALTER TABLE public.engagement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_engagement_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS engagement_logs_select_member ON public.engagement_logs;
CREATE POLICY engagement_logs_select_member ON public.engagement_logs FOR SELECT
  USING (is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS uep_select_member ON public.user_engagement_points;
CREATE POLICY uep_select_member ON public.user_engagement_points FOR SELECT
  USING (is_tenant_member(auth.uid(), tenant_id));
