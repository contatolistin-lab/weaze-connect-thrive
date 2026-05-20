CREATE OR REPLACE FUNCTION public.notify_group_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_name TEXT;
  v_tenant_id UUID;
  v_adder_name TEXT;
  v_group_type TEXT;
BEGIN
  SELECT g.name, g.tenant_id, g.type INTO v_group_name, v_tenant_id, v_group_type
  FROM public.groups g WHERE g.id = NEW.group_id;

  SELECT p.name INTO v_adder_name
  FROM public.profiles p WHERE p.user_id = NEW.added_by;

  IF NOT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = NEW.user_id
      AND type = 'group_invite'
      AND reference_id = NEW.group_id
      AND created_at > now() - interval '24 hours'
  ) THEN
    INSERT INTO public.notifications (
      tenant_id,
      user_id,
      type,
      title,
      body,
      priority,
      data,
      actor_id,
      reference_id
    ) VALUES (
      v_tenant_id,
      NEW.user_id,
      'group_invite',
      'Você foi adicionado ao grupo ' || COALESCE(v_group_name, 'desconhecido'),
      COALESCE(v_adder_name, 'Alguém') || ' convidou você para participar',
      'medium',
      jsonb_build_object(
        'group_id', NEW.group_id,
        'group_name', v_group_name,
        'group_type', v_group_type,
        'added_by', NEW.added_by
      ),
      NEW.added_by,
      NEW.group_id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_group_invite ON public.group_members;

CREATE TRIGGER trg_notify_group_invite
AFTER INSERT ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION public.notify_group_invite();
