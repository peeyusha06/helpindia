-- Add ngo_id to donations table
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS ngo_id uuid;

-- Create RPC function for atomic donation + notification creation
CREATE OR REPLACE FUNCTION public.create_donation_and_notify(
  p_donor_id uuid,
  p_ngo_id uuid,
  p_amount numeric,
  p_campaign text,
  p_event_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_donation_id uuid;
  v_notification_id uuid;
  v_donor_name text;
  v_ngo_name text;
BEGIN
  -- Get donor and NGO names
  SELECT name INTO v_donor_name FROM public.profiles WHERE id = p_donor_id;
  SELECT name INTO v_ngo_name FROM public.profiles WHERE id = p_ngo_id;

  -- Insert donation
  INSERT INTO public.donations (donor_id, ngo_id, amount, campaign)
  VALUES (p_donor_id, p_ngo_id, p_amount, p_campaign)
  RETURNING id INTO v_donation_id;

  -- Create notification for donor
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    p_donor_id,
    'Donation Confirmed',
    'Thank you for donating ₹' || p_amount || ' to ' || COALESCE(v_ngo_name, 'the organization'),
    'donation'
  )
  RETURNING id INTO v_notification_id;

  -- Create notification for NGO
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    p_ngo_id,
    'New Donation Received',
    COALESCE(v_donor_name, 'A donor') || ' has donated ₹' || p_amount || ' to ' || p_campaign,
    'donation'
  );

  -- Return success with IDs
  RETURN json_build_object(
    'donation_id', v_donation_id,
    'notification_id', v_notification_id,
    'success', true
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_donation_and_notify TO authenticated;

-- Update RLS policy for donations to allow NGOs to view donations made to them
DROP POLICY IF EXISTS "Donors can view own donations" ON public.donations;

CREATE POLICY "Donors can view own donations" 
ON public.donations 
FOR SELECT 
USING (
  auth.uid() = donor_id 
  OR auth.uid() = ngo_id 
  OR has_role(auth.uid(), 'ngo'::app_role)
);

-- Enable realtime for donations
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;