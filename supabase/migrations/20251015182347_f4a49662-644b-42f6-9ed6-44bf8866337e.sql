-- Fix the security definer view warning
-- Drop and recreate the view without SECURITY DEFINER (it's SECURITY INVOKER by default)
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker=true)
AS
SELECT id, name, avatar_url, badges, events_joined, hours_volunteered
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;