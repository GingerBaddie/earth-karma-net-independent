
-- Create coupons table (admin-managed coupons available for redemption)
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '🎟️',
  points_cost INTEGER NOT NULL,
  coupon_code TEXT NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  max_redemptions INTEGER,
  total_redeemed INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active coupons
CREATE POLICY "Authenticated users can view active coupons"
ON public.coupons FOR SELECT
USING (is_active = true);

-- Admins can manage coupons
CREATE POLICY "Admins can manage coupons"
ON public.coupons FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user_coupons table (track user redemptions)
CREATE TABLE public.user_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id),
  points_spent INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, coupon_id)
);

ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

-- Users can view their own redeemed coupons
CREATE POLICY "Users can view own redeemed coupons"
ON public.user_coupons FOR SELECT
USING (auth.uid() = user_id);

-- Users can redeem coupons
CREATE POLICY "Users can redeem coupons"
ON public.user_coupons FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all redemptions
CREATE POLICY "Admins can view all redemptions"
ON public.user_coupons FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to redeem a coupon (atomic: deducts points, inserts redemption, increments counter)
CREATE OR REPLACE FUNCTION public.redeem_coupon(p_coupon_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller UUID;
  v_points_cost INTEGER;
  v_user_points INTEGER;
  v_max INTEGER;
  v_total INTEGER;
  v_active BOOLEAN;
  v_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  v_caller := auth.uid();

  SELECT points_cost, max_redemptions, total_redeemed, is_active, expiry_date
  INTO v_points_cost, v_max, v_total, v_active, v_expiry
  FROM public.coupons
  WHERE id = p_coupon_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Coupon not found';
  END IF;

  IF NOT v_active THEN
    RAISE EXCEPTION 'This coupon is no longer active';
  END IF;

  IF v_expiry IS NOT NULL AND v_expiry < now() THEN
    RAISE EXCEPTION 'This coupon has expired';
  END IF;

  IF v_max IS NOT NULL AND v_total >= v_max THEN
    RAISE EXCEPTION 'This coupon has reached its maximum redemptions';
  END IF;

  -- Check if already redeemed
  IF EXISTS (SELECT 1 FROM public.user_coupons WHERE user_id = v_caller AND coupon_id = p_coupon_id) THEN
    RAISE EXCEPTION 'You have already redeemed this coupon';
  END IF;

  SELECT points INTO v_user_points FROM public.profiles WHERE user_id = v_caller;

  IF v_user_points < v_points_cost THEN
    RAISE EXCEPTION 'Insufficient points. You need % points but have %', v_points_cost, v_user_points;
  END IF;

  -- Deduct points
  UPDATE public.profiles SET points = points - v_points_cost, updated_at = now() WHERE user_id = v_caller;

  -- Record redemption
  INSERT INTO public.user_coupons (user_id, coupon_id, points_spent) VALUES (v_caller, p_coupon_id, v_points_cost);

  -- Increment counter
  UPDATE public.coupons SET total_redeemed = total_redeemed + 1 WHERE id = p_coupon_id;
END;
$$;

-- Seed some sample coupons
INSERT INTO public.coupons (title, description, icon, points_cost, coupon_code, expiry_date, max_redemptions) VALUES
('10% Off EcoMart', 'Get 10% discount on your next purchase at EcoMart online store.', '🛒', 100, 'ECOMART10', now() + interval '6 months', 500),
('Free Tree Sapling', 'Redeem for one free tree sapling from our nursery partner.', '🌱', 200, 'SAPLING2024', now() + interval '1 year', 200),
('Coffee Shop Voucher', 'Free eco-friendly coffee at GreenBrew cafe.', '☕', 150, 'GREENBREW50', now() + interval '3 months', 300),
('Reusable Bag Kit', 'Claim your set of 3 premium reusable shopping bags.', '🛍️', 250, 'BAGKIT25', now() + interval '1 year', 100),
('₹50 Cashback', 'Get ₹50 cashback on your next eco-product purchase.', '💰', 500, 'CASHBACK50', now() + interval '2 months', 150);
