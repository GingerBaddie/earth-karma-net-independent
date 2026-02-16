
-- Add waste_kg column to activities
ALTER TABLE public.activities ADD COLUMN waste_kg numeric DEFAULT NULL;

-- Update landing stats RPC to include real waste total
CREATE OR REPLACE FUNCTION public.get_landing_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT json_build_object(
    'activities', (SELECT count(*) FROM public.activities WHERE status = 'approved'),
    'users', (SELECT count(*) FROM public.profiles),
    'waste_kg', (SELECT COALESCE(sum(waste_kg), 0) FROM public.activities WHERE status = 'approved')
  );
$$;
