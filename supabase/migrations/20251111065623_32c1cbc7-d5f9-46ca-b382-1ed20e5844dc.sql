-- Drop the security definer view and recreate without it
DROP VIEW IF EXISTS public.volunteer_leaderboard;

-- Create view for leaderboard without SECURITY DEFINER
CREATE OR REPLACE VIEW public.volunteer_leaderboard AS
SELECT 
  p.id,
  p.name,
  p.avatar_url,
  p.events_joined,
  p.hours_volunteered,
  p.badges
FROM public.profiles p
WHERE p.hours_volunteered > 0
ORDER BY p.hours_volunteered DESC, p.events_joined DESC
LIMIT 100;

-- Make leaderboard publicly viewable
GRANT SELECT ON public.volunteer_leaderboard TO authenticated, anon;

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;