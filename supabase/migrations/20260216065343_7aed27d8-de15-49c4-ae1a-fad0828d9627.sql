
-- Add checkin_code and attendance_points to events
ALTER TABLE public.events ADD COLUMN checkin_code text UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex');
ALTER TABLE public.events ADD COLUMN attendance_points integer NOT NULL DEFAULT 25;

-- Create event_checkins table
CREATE TABLE public.event_checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  points_awarded integer NOT NULL DEFAULT 0,
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view checkins" ON public.event_checkins FOR SELECT USING (true);
CREATE POLICY "Users can checkin themselves" ON public.event_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Checkin function
CREATE OR REPLACE FUNCTION public.checkin_event(p_event_id uuid, p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_points integer;
  v_caller uuid;
BEGIN
  v_caller := auth.uid();

  SELECT attendance_points INTO v_points
  FROM public.events
  WHERE id = p_event_id AND checkin_code = p_code;

  IF v_points IS NULL THEN
    RAISE EXCEPTION 'Invalid event or code';
  END IF;

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
$$;
