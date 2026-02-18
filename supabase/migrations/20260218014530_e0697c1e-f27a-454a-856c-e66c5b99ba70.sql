
-- Add event_type column to events table using existing activity_type enum
ALTER TABLE public.events ADD COLUMN event_type activity_type NOT NULL DEFAULT 'cleanup';

-- Update checkin_event to award points based on event_type
CREATE OR REPLACE FUNCTION public.checkin_event(p_event_id uuid, p_code text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_points integer;
  v_event_type activity_type;
  v_caller uuid;
BEGIN
  v_caller := auth.uid();

  SELECT attendance_points, event_type INTO v_points, v_event_type
  FROM public.events
  WHERE id = p_event_id AND checkin_code = p_code;

  IF v_points IS NULL THEN
    RAISE EXCEPTION 'Invalid event or code';
  END IF;

  -- Override points based on event type
  v_points := CASE v_event_type
    WHEN 'tree_plantation' THEN 50
    WHEN 'cleanup' THEN 30
    WHEN 'recycling' THEN 20
    WHEN 'eco_habit' THEN 5
  END;

  INSERT INTO public.event_checkins (event_id, user_id, points_awarded)
  VALUES (p_event_id, v_caller, v_points);

  UPDATE public.profiles
  SET points = points + v_points, updated_at = now()
  WHERE user_id = v_caller;

  INSERT INTO public.user_rewards (user_id, reward_id)
  SELECT v_caller, r.id
  FROM public.rewards r
  WHERE r.points_required <= (SELECT points FROM public.profiles WHERE user_id = v_caller)
    AND NOT EXISTS (SELECT 1 FROM public.user_rewards ur WHERE ur.user_id = v_caller AND ur.reward_id = r.id);
END;
$function$;

-- Update approve_activity to only allow admins (not organizers) for standalone activity submissions
CREATE OR REPLACE FUNCTION public.approve_activity(activity_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_type activity_type;
  v_points INTEGER;
BEGIN
  -- Only admins can approve standalone activities
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only super admins can approve activity submissions';
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
$function$;
