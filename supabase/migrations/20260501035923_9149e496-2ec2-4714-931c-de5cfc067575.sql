
-- Add 'live' to cta_type enum
ALTER TYPE public.cta_type ADD VALUE IF NOT EXISTS 'live';

-- Tenants: add mrr & active
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS mrr NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Interactions: add cta_type
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS cta_type TEXT;

-- Appointments already has created_at; ensure
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Lives table
CREATE TABLE IF NOT EXISTS public.lives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  external_url TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  is_live BOOLEAN NOT NULL DEFAULT false,
  post_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lives_select_all ON public.lives;
CREATE POLICY lives_select_all ON public.lives FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS lives_manage_member ON public.lives;
CREATE POLICY lives_manage_member ON public.lives FOR ALL
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT,
  priority TEXT NOT NULL DEFAULT 'low',
  read_at TIMESTAMPTZ,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notif_select_own ON public.notifications;
CREATE POLICY notif_select_own ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notif_update_own ON public.notifications;
CREATE POLICY notif_update_own ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notif_delete_own ON public.notifications;
CREATE POLICY notif_delete_own ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notif_insert_owner ON public.notifications;
CREATE POLICY notif_insert_owner ON public.notifications FOR INSERT
  WITH CHECK (public.is_tenant_owner(auth.uid(), tenant_id) OR auth.uid() = user_id);

-- users view (admin reads only id + created_at via profiles)
CREATE OR REPLACE VIEW public.users
WITH (security_invoker=on) AS
  SELECT user_id AS id, created_at FROM public.profiles;

-- tenant_stats view (minimal: counts posts per day per tenant)
CREATE OR REPLACE VIEW public.tenant_stats
WITH (security_invoker=on) AS
  SELECT
    p.id,
    p.tenant_id,
    p.created_at
  FROM public.posts p;
