-- Sistema de Lives
-- Tabela principal
CREATE TABLE public.lives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  external_url TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  is_live BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE public.lives ENABLE ROW LEVEL SECURITY;

-- Política: owners podem gerenciar
CREATE POLICY "lives_manage_by_owner" ON public.lives FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = lives.tenant_id
    AND owner_id = auth.uid()
  )
);

-- Política: membros podem ler
CREATE POLICY "lives_read_members" ON public.lives FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = lives.tenant_id
    AND user_id = auth.uid()
  )
);