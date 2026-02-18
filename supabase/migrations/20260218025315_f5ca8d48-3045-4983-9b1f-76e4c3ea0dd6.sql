
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Allow authenticated users to view all profiles (needed for leaderboard)
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);
