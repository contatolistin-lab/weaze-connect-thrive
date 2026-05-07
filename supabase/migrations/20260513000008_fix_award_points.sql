-- Fix: Secure award_engagement_points function
-- Prevents users from inflating leaderboard scores for other accounts

CREATE OR REPLACE FUNCTION public.award_engagement_points(
  p_user_id UUID,
  p_tenant_id UUID,
  p_action_type TEXT,
  p_points INTEGER DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_max_points INTEGER := 100;
BEGIN
  -- Validate inputs
  IF p_points IS NULL OR p_points <= 0 THEN RETURN; END IF;
  IF p_user_id IS NULL OR p_tenant_id IS NULL THEN RAISE EXCEPTION 'Missing required parameters'; END IF;

  -- Cap points to prevent abuse
  p_points := LEAST(p_points, v_max_points);

  -- Only allow awarding points to self OR if caller is tenant owner/admin
  IF p_user_id != auth.uid()
     AND NOT public.is_tenant_owner(auth.uid(), p_tenant_id)
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized to award points to other users';
  END IF;

  -- Validate action_type
  IF p_action_type NOT IN ('view', 'like', 'comment', 'click_cta', 'conversion') THEN
    RAISE EXCEPTION 'Invalid action_type: %', p_action_type;
  END IF;

  -- Prevent duplicate awards for same action on same reference
  IF EXISTS (
    SELECT 1 FROM engagement_logs
    WHERE user_id = p_user_id
      AND tenant_id = p_tenant_id
      AND action_type = p_action_type
      AND reference_id IS NOT DISTINCT FROM p_reference_id
    LIMIT 1
  ) THEN RETURN; END IF;

  -- Insert engagement log
  INSERT INTO public.engagement_logs (user_id, tenant_id, action_type, points, reference_id, metadata)
  VALUES (p_user_id, p_tenant_id, p_action_type, p_points, p_reference_id, p_metadata);

  -- Update user engagement points
  INSERT INTO public.user_engagement_points (user_id, tenant_id, total_points, monthly_points, yearly_points, last_updated_at)
  VALUES (p_user_id, p_tenant_id, p_points, p_points, p_points, now())
  ON CONFLICT (user_id, tenant_id) DO UPDATE SET
    total_points = user_engagement_points.total_points + EXCLUDED.total_points,
    monthly_points = user_engagement_points.monthly_points + EXCLUDED.monthly_points,
    yearly_points = user_engagement_points.yearly_points + EXCLUDED.yearly_points,
    last_updated_at = now();
END;
$$;