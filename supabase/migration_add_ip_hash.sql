-- Add ip_hash column to user_profiles for anti-abuse tracking
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS ip_hash text;

-- Create index for faster IP hash lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_ip_hash ON public.user_profiles(ip_hash);

-- Add abuse_detected flag to track accounts flagged for abuse
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS abuse_detected boolean NOT NULL DEFAULT false;

-- Function to check for IP abuse during signup
CREATE OR REPLACE FUNCTION public.check_ip_abuse(ip_hash_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  abuse_count integer;
BEGIN
  -- Count free plan accounts with this IP that have exhausted their generations
  SELECT COUNT(*)
  INTO abuse_count
  FROM public.user_profiles
  WHERE ip_hash = ip_hash_param
    AND plan = 'free'
    AND generations_used_this_week >= 3;

  -- If more than 2 accounts from this IP have exhausted free generations, flag as abuse
  RETURN abuse_count > 2;
END;
$$;

-- Update the handle_new_user function to capture IP hash and check for abuse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_ip_hash text;
  is_abuse boolean;
BEGIN
  -- Get IP hash from user metadata (will be set by the auth callback)
  user_ip_hash := new.raw_user_meta_data->>'ip_hash';

  -- Check if this IP has been used for abuse
  is_abuse := false;
  IF user_ip_hash IS NOT NULL THEN
    is_abuse := public.check_ip_abuse(user_ip_hash);
  END IF;

  -- Create user profile with IP hash and abuse flag
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, ip_hash, abuse_detected)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    user_ip_hash,
    is_abuse
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;
