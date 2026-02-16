
-- Allow admins to read all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all activities
CREATE POLICY "Admins can view all activities"
  ON public.activities FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update activities
CREATE POLICY "Admins can update activities"
  ON public.activities FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage all events
CREATE POLICY "Admins can manage all events"
  ON public.events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
