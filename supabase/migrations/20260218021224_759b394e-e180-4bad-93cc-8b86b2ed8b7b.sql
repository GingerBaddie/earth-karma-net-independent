
-- Add account_status enum
CREATE TYPE public.account_status AS ENUM ('active', 'suspended', 'banned');

-- Add status column to profiles
ALTER TABLE public.profiles
ADD COLUMN account_status account_status NOT NULL DEFAULT 'active';

-- Allow admins to update account_status on profiles
-- (existing RLS already allows admin SELECT via has_role; we need admin UPDATE)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
