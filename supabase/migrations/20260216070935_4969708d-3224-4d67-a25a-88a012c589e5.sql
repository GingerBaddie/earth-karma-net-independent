
-- Add city column to profiles
ALTER TABLE public.profiles ADD COLUMN city TEXT;

-- Add latitude and longitude columns to events for precise location
ALTER TABLE public.events ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE public.events ADD COLUMN longitude DOUBLE PRECISION;
