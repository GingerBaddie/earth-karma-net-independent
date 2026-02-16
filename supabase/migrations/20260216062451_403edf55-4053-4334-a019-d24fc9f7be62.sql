
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('citizen', 'organizer');

-- Create activity type enum
CREATE TYPE public.activity_type AS ENUM ('tree_plantation', 'cleanup', 'recycling', 'eco_habit');

-- Create activity status enum
CREATE TYPE public.activity_status AS ENUM ('pending', 'approved', 'rejected');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'citizen',
  UNIQUE (user_id, role)
);

-- Activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type activity_type NOT NULL,
  image_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  description TEXT,
  status activity_status NOT NULL DEFAULT 'pending',
  points_awarded INTEGER NOT NULL DEFAULT 0,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event participants join table
CREATE TABLE public.event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- Rewards table
CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆'
);

-- User rewards tracking
CREATE TABLE public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, reward_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles RLS
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles RLS
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role on signup" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Activities RLS
CREATE POLICY "Users can view own activities" ON public.activities FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Organizers can view all activities" ON public.activities FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Users can submit activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Organizers can update activities" ON public.activities FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'organizer'));

-- Events RLS
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Organizers can create events" ON public.events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers can update own events" ON public.events FOR UPDATE TO authenticated USING (created_by = auth.uid() AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers can delete own events" ON public.events FOR DELETE TO authenticated USING (created_by = auth.uid() AND public.has_role(auth.uid(), 'organizer'));

-- Event participants RLS
CREATE POLICY "Anyone can view participants" ON public.event_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated can join events" ON public.event_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave events" ON public.event_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Rewards RLS (public read)
CREATE POLICY "Anyone can view rewards" ON public.rewards FOR SELECT USING (true);
CREATE POLICY "Organizers can manage rewards" ON public.rewards FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'organizer'));

-- User rewards RLS
CREATE POLICY "Users can view own rewards" ON public.user_rewards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert rewards" ON public.user_rewards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to approve activity and award points
CREATE OR REPLACE FUNCTION public.approve_activity(activity_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_type activity_type;
  v_points INTEGER;
BEGIN
  -- Check caller is organizer
  IF NOT public.has_role(auth.uid(), 'organizer') THEN
    RAISE EXCEPTION 'Only organizers can approve activities';
  END IF;

  -- Get activity details
  SELECT user_id, type INTO v_user_id, v_type
  FROM public.activities
  WHERE id = activity_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Activity not found or already reviewed';
  END IF;

  -- Calculate points
  v_points := CASE v_type
    WHEN 'tree_plantation' THEN 50
    WHEN 'cleanup' THEN 30
    WHEN 'recycling' THEN 20
    WHEN 'eco_habit' THEN 5
  END;

  -- Update activity
  UPDATE public.activities
  SET status = 'approved', points_awarded = v_points, reviewed_by = auth.uid()
  WHERE id = activity_id;

  -- Update user points
  UPDATE public.profiles
  SET points = points + v_points, updated_at = now()
  WHERE user_id = v_user_id;

  -- Auto-unlock rewards
  INSERT INTO public.user_rewards (user_id, reward_id)
  SELECT v_user_id, r.id
  FROM public.rewards r
  WHERE r.points_required <= (SELECT points FROM public.profiles WHERE user_id = v_user_id)
    AND NOT EXISTS (SELECT 1 FROM public.user_rewards ur WHERE ur.user_id = v_user_id AND ur.reward_id = r.id);
END;
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for activity images
INSERT INTO storage.buckets (id, name, public) VALUES ('activity-images', 'activity-images', true);

-- Storage policies
CREATE POLICY "Anyone can view activity images" ON storage.objects FOR SELECT USING (bucket_id = 'activity-images');
CREATE POLICY "Authenticated users can upload activity images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'activity-images');

-- Seed default rewards
INSERT INTO public.rewards (name, description, points_required, icon) VALUES
  ('Eco Starter', 'Complete your first activity', 5, '🌱'),
  ('Green Guardian', 'Earn 50 points', 50, '🛡️'),
  ('Nature Champion', 'Earn 150 points', 150, '🏆'),
  ('Earth Hero', 'Earn 300 points', 300, '🌍'),
  ('Planet Protector', 'Earn 500 points', 500, '💚');
