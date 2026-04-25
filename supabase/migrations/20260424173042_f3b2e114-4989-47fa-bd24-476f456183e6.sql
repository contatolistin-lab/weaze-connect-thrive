-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'b2b', 'b2c');
CREATE TYPE public.tenant_role AS ENUM ('owner', 'member');
CREATE TYPE public.post_type AS ENUM ('video', 'image', 'text');
CREATE TYPE public.cta_type AS ENUM ('buy', 'schedule', 'quote', 'register', 'info');
CREATE TYPE public.interaction_type AS ENUM ('view', 'like', 'comment', 'click_cta', 'conversion');
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- ============ UTIL TRIGGER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-criar profile no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'b2c');
  RETURN NEW;
END; $$;

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin'));

-- Trigger profile + role
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ TENANTS ============
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#111111',
  secondary_color TEXT DEFAULT '#F5F5F0',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ MEMBERSHIPS ============
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role tenant_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id)
);
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_memberships_tenant ON public.memberships(tenant_id);
CREATE INDEX idx_memberships_user ON public.memberships(user_id);

CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.memberships WHERE user_id=_user_id AND tenant_id=_tenant_id);
$$;
CREATE OR REPLACE FUNCTION public.is_tenant_owner(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.memberships WHERE user_id=_user_id AND tenant_id=_tenant_id AND role='owner');
$$;

-- Tenants policies (depois das funções)
CREATE POLICY "tenants_select_all" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "tenants_insert_authenticated" ON public.tenants FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "tenants_update_owner" ON public.tenants FOR UPDATE USING (public.is_tenant_owner(auth.uid(), id));
CREATE POLICY "tenants_delete_owner" ON public.tenants FOR DELETE USING (public.is_tenant_owner(auth.uid(), id));

-- Memberships policies
CREATE POLICY "memberships_select_self_or_owner" ON public.memberships FOR SELECT
  USING (auth.uid() = user_id OR public.is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "memberships_insert_self" ON public.memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memberships_owner_manage" ON public.memberships FOR ALL
  USING (public.is_tenant_owner(auth.uid(), tenant_id));

-- Trigger: ao criar tenant, o criador vira owner
CREATE OR REPLACE FUNCTION public.handle_new_tenant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.memberships (user_id, tenant_id, role)
    VALUES (NEW.created_by, NEW.id, 'owner')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_tenant_owner AFTER INSERT ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.handle_new_tenant();

-- ============ POSTS ============
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  type post_type NOT NULL,
  media_url TEXT,
  thumbnail_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_posts_tenant_created ON public.posts(tenant_id, created_at DESC);
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "posts_select_all" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_member" ON public.posts FOR INSERT WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "posts_update_owner" ON public.posts FOR UPDATE USING (public.is_tenant_owner(auth.uid(), tenant_id) OR auth.uid() = author_id);
CREATE POLICY "posts_delete_owner" ON public.posts FOR DELETE USING (public.is_tenant_owner(auth.uid(), tenant_id) OR auth.uid() = author_id);

-- ============ POST CTA ============
CREATE TABLE public.post_cta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  type cta_type NOT NULL,
  label TEXT NOT NULL,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.post_cta ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_post_cta_post ON public.post_cta(post_id);

CREATE POLICY "post_cta_select_all" ON public.post_cta FOR SELECT USING (true);
CREATE POLICY "post_cta_manage_owner" ON public.post_cta FOR ALL USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.is_tenant_member(auth.uid(), p.tenant_id))
);

-- Validação: bloquear wa.me em CTA buy
CREATE OR REPLACE FUNCTION public.validate_cta()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE checkout TEXT;
BEGIN
  IF NEW.type = 'buy' THEN
    checkout := NEW.config_json->>'checkout_url';
    IF checkout IS NULL OR length(checkout) = 0 THEN
      RAISE EXCEPTION 'checkout_url is required for buy CTA';
    END IF;
    IF checkout ILIKE '%wa.me%' OR checkout ILIKE '%whatsapp.com%' OR checkout ILIKE '%api.whatsapp%' THEN
      RAISE EXCEPTION 'WhatsApp links are not allowed in checkout_url';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_validate_cta BEFORE INSERT OR UPDATE ON public.post_cta FOR EACH ROW EXECUTE FUNCTION public.validate_cta();

-- ============ INTERACTIONS ============
CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  cta_id UUID REFERENCES public.post_cta(id) ON DELETE SET NULL,
  action_type interaction_type NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_interactions_tenant_action ON public.interactions(tenant_id, action_type, created_at DESC);
CREATE INDEX idx_interactions_post ON public.interactions(post_id);
CREATE INDEX idx_interactions_user ON public.interactions(user_id);

CREATE POLICY "interactions_insert_any" ON public.interactions FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "interactions_select_own_or_owner" ON public.interactions FOR SELECT
  USING (auth.uid() = user_id OR public.is_tenant_owner(auth.uid(), tenant_id));

-- ============ SERVICES (agenda) ============
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "services_select_all" ON public.services FOR SELECT USING (true);
CREATE POLICY "services_manage_member" ON public.services FOR ALL USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avail_select_all" ON public.availability_rules FOR SELECT USING (true);
CREATE POLICY "avail_manage_member" ON public.availability_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND public.is_tenant_member(auth.uid(), s.tenant_id))
);

CREATE TABLE public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  date DATE NOT NULL
);
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocked_select_all" ON public.blocked_dates FOR SELECT USING (true);
CREATE POLICY "blocked_manage_member" ON public.blocked_dates FOR ALL USING (
  EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND public.is_tenant_member(auth.uid(), s.tenant_id))
);

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  status appointment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (service_id, date, time)
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_appointments_tenant ON public.appointments(tenant_id, date);
CREATE POLICY "appointments_insert_any" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "appointments_select_own_or_owner" ON public.appointments FOR SELECT
  USING (auth.uid() = user_id OR public.is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "appointments_update_owner" ON public.appointments FOR UPDATE USING (public.is_tenant_owner(auth.uid(), tenant_id));

-- ============ QUOTES ============
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_contact TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotes_insert_any" ON public.quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "quotes_select_own_or_owner" ON public.quotes FOR SELECT
  USING (auth.uid() = user_id OR public.is_tenant_owner(auth.uid(), tenant_id));

-- ============ EVENTS ============
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  capacity_limit INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select_all" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_manage_member" ON public.events FOR ALL USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evreg_insert_any" ON public.event_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "evreg_select_own_or_owner" ON public.event_registrations FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND public.is_tenant_owner(auth.uid(), e.tenant_id))
  );

-- ============ MENSAGENS PRIVADAS ============
CREATE TABLE public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "threads_select_user_or_owner" ON public.message_threads FOR SELECT
  USING (auth.uid() = user_id OR public.is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "threads_insert_user" ON public.message_threads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_messages_thread ON public.messages(thread_id, created_at);
CREATE POLICY "messages_select_participants" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.message_threads t WHERE t.id = thread_id
    AND (t.user_id = auth.uid() OR public.is_tenant_owner(auth.uid(), t.tenant_id)))
);
CREATE POLICY "messages_insert_participants" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.message_threads t WHERE t.id = thread_id
    AND (t.user_id = auth.uid() OR public.is_tenant_owner(auth.uid(), t.tenant_id))
  )
);

-- ============ COMUNIDADE ============
CREATE TABLE public.community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_community_tenant_created ON public.community_messages(tenant_id, created_at DESC);
CREATE POLICY "community_select_member" ON public.community_messages FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "community_insert_member" ON public.community_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND public.is_tenant_member(auth.uid(), tenant_id)
);
CREATE POLICY "community_delete_self_or_owner" ON public.community_messages FOR DELETE USING (
  auth.uid() = user_id OR public.is_tenant_owner(auth.uid(), tenant_id)
);

-- ============ PLANS ============
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_posts INTEGER NOT NULL DEFAULT 100,
  max_cta INTEGER NOT NULL DEFAULT 100,
  max_members INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_select_all" ON public.plans FOR SELECT USING (true);
CREATE POLICY "plans_admin_manage" ON public.plans FOR ALL USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.tenant_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  active_since TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id)
);
ALTER TABLE public.tenant_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_plans_select_all" ON public.tenant_plans FOR SELECT USING (true);
CREATE POLICY "tenant_plans_owner_manage" ON public.tenant_plans FOR ALL USING (public.is_tenant_owner(auth.uid(), tenant_id));

CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  month TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, metric, month)
);
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_select_owner" ON public.usage_tracking FOR SELECT USING (public.is_tenant_owner(auth.uid(), tenant_id));

-- Seed planos básicos
INSERT INTO public.plans (name, price, max_posts, max_cta, max_members) VALUES
  ('Free', 0, 10, 5, 50),
  ('Pro', 99, 200, 100, 1000),
  ('Scale', 499, 2000, 1000, 10000);
