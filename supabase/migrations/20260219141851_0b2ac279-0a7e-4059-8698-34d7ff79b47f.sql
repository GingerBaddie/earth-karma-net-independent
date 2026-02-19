
-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE public.badge_category AS ENUM ('milestone', 'streak', 'community_impact');
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.organizer_type AS ENUM ('ngo', 'college_school', 'company_csr', 'community_group');

-- =============================================
-- BADGES TABLE
-- =============================================
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '🏅',
  category badge_category NOT NULL,
  criteria_type text NOT NULL,
  criteria_value integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view badges" ON public.badges FOR SELECT TO authenticated USING (true);

-- =============================================
-- USER_BADGES TABLE
-- =============================================
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone authenticated can view all badges earned" ON public.user_badges FOR SELECT TO authenticated USING (true);

-- =============================================
-- USER_STREAKS TABLE
-- =============================================
CREATE TABLE public.user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  CONSTRAINT user_streaks_user_id_key UNIQUE (user_id)
);
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own streak" ON public.user_streaks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON public.user_streaks FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- ORGANIZER_APPLICATIONS TABLE
-- =============================================
CREATE TABLE public.organizer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  organization_name text NOT NULL,
  organizer_type organizer_type NOT NULL,
  official_email text NOT NULL,
  contact_number text NOT NULL,
  purpose text NOT NULL,
  proof_url text,
  proof_type text,
  website_url text,
  status application_status NOT NULL DEFAULT 'pending',
  admin_remarks text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organizer_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own application" ON public.organizer_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own application" ON public.organizer_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all applications" ON public.organizer_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update applications" ON public.organizer_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- STORAGE BUCKET for organizer proofs
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('organizer-proofs', 'organizer-proofs', false);

CREATE POLICY "Users can upload own proofs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'organizer-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own proofs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'organizer-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all proofs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'organizer-proofs' AND public.has_role(auth.uid(), 'admin'));

-- =============================================
-- SEED BADGE DATA
-- =============================================
INSERT INTO public.badges (name, description, icon, category, criteria_type, criteria_value) VALUES
  ('First Steps', 'Complete your first approved activity', '🌱', 'milestone', 'total_activities', 1),
  ('Getting Started', 'Complete 10 approved activities', '🌿', 'milestone', 'total_activities', 10),
  ('Tree Planter Pro', 'Plant 100 trees through approved activities', '🌳', 'milestone', 'tree_plantation_count', 100),
  ('Cleanup Champion', 'Complete 50 cleanup activities', '🧹', 'milestone', 'cleanup_count', 50),
  ('Recycling Master', 'Complete 30 recycling activities', '♻️', 'milestone', 'recycling_count', 30),
  ('Eco Habit Guru', 'Log 200 eco habit activities', '🧘', 'milestone', 'eco_habit_count', 200),
  ('7-Day Eco Warrior', 'Maintain a 7-day activity streak', '🔥', 'streak', 'streak_days', 7),
  ('30-Day Consistency', 'Maintain a 30-day activity streak', '⚡', 'streak', 'streak_days', 30),
  ('90-Day Legend', 'Maintain a 90-day activity streak', '👑', 'streak', 'streak_days', 90),
  ('Plastic Eliminator', 'Collect 100 kg of waste', '🗑️', 'community_impact', 'waste_kg', 100),
  ('Waste Warrior', 'Collect 500 kg of waste', '💪', 'community_impact', 'waste_kg', 500),
  ('Ton Crusher', 'Collect 1000 kg of waste', '🏆', 'community_impact', 'waste_kg', 1000);

-- =============================================
-- CHECK_AND_AWARD_BADGES FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total integer;
  v_tree integer;
  v_cleanup integer;
  v_recycling integer;
  v_eco_habit integer;
  v_waste numeric;
  v_streak integer;
  v_last_date date;
  v_today date := current_date;
  v_badge RECORD;
  v_val integer;
BEGIN
  -- Count activities by type
  SELECT count(*) INTO v_total FROM public.activities WHERE user_id = p_user_id AND status = 'approved';
  SELECT count(*) INTO v_tree FROM public.activities WHERE user_id = p_user_id AND status = 'approved' AND type = 'tree_plantation';
  SELECT count(*) INTO v_cleanup FROM public.activities WHERE user_id = p_user_id AND status = 'approved' AND type = 'cleanup';
  SELECT count(*) INTO v_recycling FROM public.activities WHERE user_id = p_user_id AND status = 'approved' AND type = 'recycling';
  SELECT count(*) INTO v_eco_habit FROM public.activities WHERE user_id = p_user_id AND status = 'approved' AND type = 'eco_habit';
  SELECT COALESCE(sum(waste_kg), 0) INTO v_waste FROM public.activities WHERE user_id = p_user_id AND status = 'approved';

  -- Update streak
  SELECT current_streak, last_activity_date INTO v_streak, v_last_date
  FROM public.user_streaks WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (p_user_id, 1, 1, v_today);
    v_streak := 1;
  ELSIF v_last_date = v_today THEN
    -- Already tracked today, no change
    NULL;
  ELSIF v_last_date = v_today - 1 THEN
    v_streak := v_streak + 1;
    UPDATE public.user_streaks
    SET current_streak = v_streak,
        longest_streak = GREATEST(longest_streak, v_streak),
        last_activity_date = v_today
    WHERE user_id = p_user_id;
  ELSE
    v_streak := 1;
    UPDATE public.user_streaks
    SET current_streak = 1, last_activity_date = v_today
    WHERE user_id = p_user_id;
  END IF;

  -- Award badges
  FOR v_badge IN SELECT id, criteria_type, criteria_value FROM public.badges LOOP
    v_val := CASE v_badge.criteria_type
      WHEN 'total_activities' THEN v_total
      WHEN 'tree_plantation_count' THEN v_tree
      WHEN 'cleanup_count' THEN v_cleanup
      WHEN 'recycling_count' THEN v_recycling
      WHEN 'eco_habit_count' THEN v_eco_habit
      WHEN 'streak_days' THEN v_streak
      WHEN 'waste_kg' THEN v_waste::integer
      ELSE 0
    END;

    IF v_val >= v_badge.criteria_value THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (p_user_id, v_badge.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- =============================================
-- UPDATE approve_activity TO CALL check_and_award_badges
-- =============================================
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

  PERFORM public.check_and_award_badges(v_user_id);
END;
$$;

-- =============================================
-- UPDATE checkin_event TO CALL check_and_award_badges
-- =============================================
CREATE OR REPLACE FUNCTION public.checkin_event(p_event_id uuid, p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  PERFORM public.check_and_award_badges(v_caller);
END;
$$;

-- =============================================
-- APPROVE/REJECT ORGANIZER APPLICATION FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION public.approve_organizer_application(p_application_id uuid, p_remarks text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve applications';
  END IF;

  SELECT user_id INTO v_user_id
  FROM public.organizer_applications
  WHERE id = p_application_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Application not found or already reviewed';
  END IF;

  UPDATE public.organizer_applications
  SET status = 'approved', admin_remarks = p_remarks, reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = p_application_id;

  UPDATE public.user_roles
  SET role = 'organizer'
  WHERE user_id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_organizer_application(p_application_id uuid, p_remarks text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reject applications';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.organizer_applications WHERE id = p_application_id AND status = 'pending') THEN
    RAISE EXCEPTION 'Application not found or already reviewed';
  END IF;

  UPDATE public.organizer_applications
  SET status = 'rejected', admin_remarks = p_remarks, reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = p_application_id;
END;
$$;
