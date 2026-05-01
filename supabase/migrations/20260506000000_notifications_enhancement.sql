-- Notifications Enhancement: actor_id, reference_id, actor profiles join
-- Add actor_id and reference_id columns for better context

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reference_id UUID;

CREATE INDEX IF NOT EXISTS idx_notifications_actor ON public.notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON public.notifications(reference_id);

-- ============ IMPROVED TRIGGERS ============

-- Enhanced topic reply notification with actor context
CREATE OR REPLACE FUNCTION public.notify_on_topic_reply()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_topic RECORD;
  v_actor_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.user_id IS NOT NULL THEN
    -- Get topic info
    SELECT t.id, t.title, t.tenant_id, t.related_post_id, t.created_by
    INTO v_topic
    FROM public.topics t WHERE t.id = NEW.topic_id;

    -- Get actor name
    SELECT p.name INTO v_actor_name
    FROM auth.users u
    JOIN public.profiles p ON p.user_id = u.id
    WHERE u.id = NEW.user_id;

    -- Notify topic owner (if not self-reply)
    IF v_topic.created_by IS NOT NULL AND v_topic.created_by != NEW.user_id THEN
      INSERT INTO public.notifications (
        tenant_id, user_id, actor_id, type, title, priority, data, reference_id
      )
      VALUES (
        v_topic.tenant_id, 
        v_topic.created_by, 
        NEW.user_id, 
        'reply_message', 
        COALESCE(v_actor_name, 'Alguém') || ' respondeu sua mensagem',
        'medium',
        jsonb_build_object('topic_id', v_topic.id, 'post_id', v_topic.related_post_id),
        v_topic.id
      );
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_topic_reply ON public.topic_messages;
CREATE TRIGGER trg_notify_topic_reply AFTER INSERT ON public.topic_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_topic_reply();

-- Live start notification
CREATE OR REPLACE FUNCTION public.notify_on_live_start()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_tenant_id UUID;
  v_author_id UUID;
BEGIN
  IF NEW.is_live = true AND (OLD.is_live IS DISTINCT FROM true) THEN
    v_tenant_id := NEW.tenant_id;
    v_author_id := NEW.author_id;
    
    -- Notify all members except author
    INSERT INTO public.notifications (tenant_id, user_id, actor_id, type, title, priority, data, reference_id)
    SELECT v_tenant_id, m.user_id, v_author_id, 'live_started', '🔴 Live iniciada! Participe agora', 'high',
      jsonb_build_object('post_id', NEW.id, 'author_id', v_author_id),
      NEW.id
    FROM public.memberships m
    WHERE m.tenant_id = v_tenant_id AND m.user_id != v_author_id;
  END IF;
  RETURN NEW;
END; $$;

-- New post notification
CREATE OR REPLACE FUNCTION public.notify_on_new_post()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_author_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT p.name INTO v_author_name
    FROM public.profiles p WHERE p.user_id = NEW.author_id;

    INSERT INTO public.notifications (
      tenant_id, user_id, actor_id, type, title, priority, data, reference_id
    )
    SELECT NEW.tenant_id, m.user_id, NEW.author_id, 'new_post', 
      COALESCE(v_author_name, 'A marca') || ' publicou um novo post',
      'low',
      jsonb_build_object('post_id', NEW.id),
      NEW.id
    FROM public.memberships m
    WHERE m.tenant_id = NEW.tenant_id AND m.user_id != NEW.author_id
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_new_post ON public.posts;
CREATE TRIGGER trg_notify_new_post AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_post();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============ MENTION NOTIFICATION ============

CREATE OR REPLACE FUNCTION public.notify_on_mention()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_mentioned_user_id UUID;
  v_actor_name TEXT;
  v_content_text TEXT;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.content IS NOT NULL THEN
    -- Extract mentioned users from content (@handle format)
    FOR v_mentioned_user_id IN
      SELECT DISTINCT p.user_id
      FROM public.profiles p
      JOIN auth.users a ON a.id = p.user_id
      WHERE LOWER(p.name) LIKE LOWER('%' || substring(NEW.content from '@(\w+)') || '%')
        AND p.user_id != NEW.user_id
    LOOP
      -- Get actor name
      SELECT pr.name INTO v_actor_name
      FROM public.profiles pr WHERE pr.user_id = NEW.user_id;
      
      -- Get first 50 chars of message
      v_content_text := LEFT(NEW.content, 50);
      
      INSERT INTO public.notifications (
        tenant_id, user_id, actor_id, type, title, priority, data, reference_id
      )
      SELECT 
        COALESCE(t.tenant_id, (SELECT tenant_id FROM public.topics WHERE id = NEW.topic_id LIMIT 1)),
        v_mentioned_user_id,
        NEW.user_id,
        'mention',
        COALESCE(v_actor_name, 'Alguém') || ' mencionou você',
        'high',
        jsonb_build_object('topic_id', NEW.topic_id, 'message', v_content_text),
        NEW.topic_id
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_mention AFTER INSERT ON public.topic_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_mention();