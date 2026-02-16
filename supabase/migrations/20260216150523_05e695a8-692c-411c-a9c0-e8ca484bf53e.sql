
-- Update approve_activity to allow admins too
CREATE OR REPLACE FUNCTION public.approve_activity(activity_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_type activity_type;
  v_points INTEGER;
BEGIN
  -- Check caller is organizer or admin
  IF NOT public.has_role(auth.uid(), 'organizer') AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only organizers or admins can approve activities';
  END IF;

  SELECT user_id, type INTO v_user_id, v_type
  FROM public.activities
  WHERE id = activity_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Activity not found or already reviewed';
  END IF;

  v_points := CASE v_type
    WHEN 'tree_plantation' THEN 50
    WHEN 'cleanup' THEN 30
    WHEN 'recycling' THEN 20
    WHEN 'eco_habit' THEN 5
  END;

  UPDATE public.activities
  SET status = 'approved', points_awarded = v_points, reviewed_by = auth.uid()
  WHERE id = activity_id;

  UPDATE public.profiles
  SET points = points + v_points, updated_at = now()
  WHERE user_id = v_user_id;

  INSERT INTO public.user_rewards (user_id, reward_id)
  SELECT v_user_id, r.id
  FROM public.rewards r
  WHERE r.points_required <= (SELECT points FROM public.profiles WHERE user_id = v_user_id)
    AND NOT EXISTS (SELECT 1 FROM public.user_rewards ur WHERE ur.user_id = v_user_id AND ur.reward_id = r.id);
END;
$$;
