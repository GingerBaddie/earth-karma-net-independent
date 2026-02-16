
CREATE OR REPLACE FUNCTION public.get_landing_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT json_build_object(
    'activities', (SELECT count(*) FROM public.activities WHERE status = 'approved'),
    'users', (SELECT count(*) FROM public.profiles)
  );
$$;
