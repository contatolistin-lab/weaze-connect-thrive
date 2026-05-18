-- Simplified member search function for groups
CREATE OR REPLACE FUNCTION public.search_group_members(
  p_tenant_id uuid,
  p_group_id uuid,
  p_search_query text
)
RETURNS TABLE (
  user_id uuid,
  name text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.name,
    p.avatar_url
  FROM public.profiles p
  INNER JOIN public.memberships m ON m.user_id = p.user_id
  WHERE m.tenant_id = p_tenant_id
    AND m.is_active = true
    AND m.role != 'owner'
    AND p.user_id NOT IN (
      SELECT gm.user_id FROM public.group_members gm WHERE gm.group_id = p_group_id
    )
    AND LOWER(p.name) LIKE '%' || LOWER(p_search_query) || '%'
  ORDER BY p.name
  LIMIT 15;
END;
$$;