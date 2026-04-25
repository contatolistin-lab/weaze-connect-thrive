CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  acct_type TEXT;
  assigned_role public.app_role;
BEGIN
  acct_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'b2c');
  IF acct_type = 'b2b' THEN
    assigned_role := 'b2b'::public.app_role;
  ELSE
    assigned_role := 'b2c'::public.app_role;
  END IF;

  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.email);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  RETURN NEW;
END;
$function$;