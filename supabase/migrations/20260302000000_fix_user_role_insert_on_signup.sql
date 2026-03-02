-- Fix: Insert user role in the trigger instead of client-side to avoid RLS issues
-- when the user is not yet fully authenticated (e.g. email confirmation pending).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));

  -- Insert role from metadata, default to 'citizen'
  _role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'citizen')::app_role;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;
