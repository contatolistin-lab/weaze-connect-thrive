-- Tabela de evento CTA
CREATE TABLE IF NOT EXISTS event_cta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id),
  event_name text NOT NULL,
  description text,
  event_date date,
  event_time text,
  location text,
  max_participants integer,
  custom_fields jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Tabela de inscrições
CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES event_cta(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id),
  tenant_id uuid REFERENCES tenants(id),
  user_id uuid REFERENCES auth.users(id),
  name text,
  email text,
  phone text,
  notes text,
  answers jsonb DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Constraint para evitar duplicatas
ALTER TABLE event_registrations
ADD CONSTRAINT unique_event_user_registration
UNIQUE (event_id, user_id);

-- Policies para event_cta
ALTER TABLE event_cta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "B2B owners can create event_cta"
ON event_cta FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.tenant_id = event_cta.tenant_id
    AND memberships.user_id = auth.uid()
    AND memberships.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Anyone can view event_cta"
ON event_cta FOR SELECT
USING (true);

-- Policies para event_registrations
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create event_registrations"
ON event_registrations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "B2B owners can view event_registrations"
ON event_registrations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.tenant_id = event_registrations.tenant_id
    AND memberships.user_id = auth.uid()
    AND memberships.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can view own event_registrations"
ON event_registrations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "B2B owners can update event_registrations"
ON event_registrations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.tenant_id = event_registrations.tenant_id
    AND memberships.user_id = auth.uid()
    AND memberships.role IN ('owner', 'admin')
  )
);

-- Índices
CREATE INDEX idx_event_cta_post ON event_cta(post_id);
CREATE INDEX idx_event_cta_tenant ON event_cta(tenant_id);
CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_tenant ON event_registrations(tenant_id);