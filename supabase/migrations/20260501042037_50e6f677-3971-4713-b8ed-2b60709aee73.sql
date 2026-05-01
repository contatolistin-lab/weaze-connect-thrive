-- Add soft-delete and edit tracking columns
ALTER TABLE public.topic_messages
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Allow UPDATE: own message, or tenant owner of topic's tenant (for soft-delete)
CREATE POLICY "update_topic_messages_own_or_owner"
ON public.topic_messages
FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.topics t
    WHERE t.id = topic_messages.topic_id
      AND public.is_tenant_owner(auth.uid(), t.tenant_id)
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.topics t
    WHERE t.id = topic_messages.topic_id
      AND public.is_tenant_owner(auth.uid(), t.tenant_id)
  )
);
