-- Create volunteer_registrations join table
CREATE TABLE IF NOT EXISTS public.volunteer_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  hours_contributed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  UNIQUE (user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.volunteer_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for volunteer_registrations
CREATE POLICY "Users can view own registrations"
  ON public.volunteer_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can register for events"
  ON public.volunteer_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own registrations"
  ON public.volunteer_registrations
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "NGOs can view registrations for their events"
  ON public.volunteer_registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = volunteer_registrations.event_id
      AND events.created_by = auth.uid()
    )
  );

-- Add status field to events if not exists
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming' 
CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled'));

-- Update notifications table structure
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info' 
CHECK (type IN ('registration', 'donation', 'event', 'update', 'info'));

ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS related_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Enable realtime for volunteer_registrations
ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteer_registrations;

-- Create function to update volunteer count
CREATE OR REPLACE FUNCTION public.update_volunteer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update profile stats when volunteer registers
    UPDATE public.profiles
    SET events_joined = events_joined + 1
    WHERE id = NEW.user_id;
    
    -- Create notification for volunteer
    INSERT INTO public.notifications (user_id, title, message, type, related_event_id)
    SELECT NEW.user_id, 
           'Registration Confirmed', 
           'You have successfully registered for ' || events.title,
           'registration',
           NEW.event_id
    FROM public.events
    WHERE events.id = NEW.event_id;
    
    -- Create notification for NGO
    INSERT INTO public.notifications (user_id, title, message, type, related_event_id)
    SELECT events.created_by,
           'New Volunteer Registered',
           profiles.name || ' has registered for ' || events.title,
           'registration',
           NEW.event_id
    FROM public.events
    JOIN public.profiles ON profiles.id = NEW.user_id
    WHERE events.id = NEW.event_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for volunteer stats
DROP TRIGGER IF EXISTS on_volunteer_registration ON public.volunteer_registrations;
CREATE TRIGGER on_volunteer_registration
  AFTER INSERT ON public.volunteer_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_volunteer_stats();

-- Create function to handle donation notifications
CREATE OR REPLACE FUNCTION public.handle_donation_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for donor
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.donor_id,
    'Donation Confirmed',
    'Thank you for donating ₹' || NEW.amount || ' to ' || NEW.campaign,
    'donation'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for donation notifications
DROP TRIGGER IF EXISTS on_donation_created ON public.donations;
CREATE TRIGGER on_donation_created
  AFTER INSERT ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.handle_donation_notification();