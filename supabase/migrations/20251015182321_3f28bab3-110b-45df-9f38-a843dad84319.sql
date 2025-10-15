-- Fix Issue 1: Restrict profile email exposure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create restricted policy for own profile only
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create public view without sensitive data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, name, avatar_url, badges, events_joined, hours_volunteered
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Fix Issue 2: Prevent role self-assignment
-- Drop the INSERT policy that allows self-assignment
DROP POLICY IF EXISTS "Users can insert own role during signup" ON public.user_roles;