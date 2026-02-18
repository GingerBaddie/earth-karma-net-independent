
-- Remove the public SELECT policy
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;

-- Organizers can view their own events (includes checkin_code for QR)
CREATE POLICY "Organizers can view own events"
ON public.events FOR SELECT
USING (created_by = auth.uid() AND has_role(auth.uid(), 'organizer'::app_role));

-- Admins can view all events
CREATE POLICY "Admins can view all events"
ON public.events FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public view that excludes checkin_code (security_invoker defaults to off, bypasses RLS)
CREATE VIEW public.events_public AS
SELECT id, title, description, event_date, event_type, location, latitude, longitude,
       attendance_points, created_by, created_at
FROM public.events;

GRANT SELECT ON public.events_public TO anon, authenticated;
