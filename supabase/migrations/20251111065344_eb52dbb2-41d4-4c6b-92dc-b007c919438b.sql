-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  related_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications (via edge functions)
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Add event image support to events table
ALTER TABLE public.events
ADD COLUMN image_url TEXT;

-- Create volunteer hours log table
CREATE TABLE public.volunteer_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  volunteer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  hours NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on volunteer hours
ALTER TABLE public.volunteer_hours ENABLE ROW LEVEL SECURITY;

-- Volunteers can view their own hours
CREATE POLICY "Volunteers can view own hours"
ON public.volunteer_hours
FOR SELECT
USING (auth.uid() = volunteer_id);

-- NGOs can view hours for their events
CREATE POLICY "NGOs can view hours for their events"
ON public.volunteer_hours
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = volunteer_hours.event_id
    AND events.created_by = auth.uid()
  )
);

-- Volunteers can insert their own hours
CREATE POLICY "Volunteers can insert own hours"
ON public.volunteer_hours
FOR INSERT
WITH CHECK (auth.uid() = volunteer_id);

-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true);

-- Allow authenticated users to upload event images
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');

-- Anyone can view event images
CREATE POLICY "Anyone can view event images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-images');

-- NGOs can update/delete their event images
CREATE POLICY "NGOs can update their event images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'event-images');

CREATE POLICY "NGOs can delete their event images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'event-images');

-- Create view for leaderboard
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