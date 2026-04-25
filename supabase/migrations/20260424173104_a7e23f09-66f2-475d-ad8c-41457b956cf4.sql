-- interactions
DROP POLICY IF EXISTS "interactions_insert_any" ON public.interactions;
CREATE POLICY "interactions_insert_safe" ON public.interactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id)
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- appointments
DROP POLICY IF EXISTS "appointments_insert_any" ON public.appointments;
CREATE POLICY "appointments_insert_safe" ON public.appointments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id)
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- quotes
DROP POLICY IF EXISTS "quotes_insert_any" ON public.quotes;
CREATE POLICY "quotes_insert_safe" ON public.quotes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id)
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- event_registrations
DROP POLICY IF EXISTS "evreg_insert_any" ON public.event_registrations;
CREATE POLICY "evreg_insert_safe" ON public.event_registrations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id)
  AND (user_id IS NULL OR user_id = auth.uid())
);
