import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

interface VolunteersListProps {
  eventId: string;
}

interface Volunteer {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  registered_at: string;
  status: string;
}

export const VolunteersList = ({ eventId }: VolunteersListProps) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVolunteers();

    // Real-time subscription
    const channel = supabase
      .channel(`volunteers-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'volunteer_registrations',
          filter: `event_id=eq.${eventId}`
        },
        () => fetchVolunteers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchVolunteers = async () => {
    try {
      // First get registrations
      const { data: registrations, error: regError } = await supabase
        .from("volunteer_registrations")
        .select("user_id, registered_at, status")
        .eq("event_id", eventId)
        .order('registered_at', { ascending: false });

      if (regError) throw regError;

      if (!registrations || registrations.length === 0) {
        setVolunteers([]);
        setLoading(false);
        return;
      }

      // Then get profile details
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url")
        .in("id", registrations.map(r => r.user_id));

      if (profileError) throw profileError;

      // Merge the data
      const transformedData = registrations.map(reg => {
        const profile = profiles?.find(p => p.id === reg.user_id);
        return {
          id: profile?.id || '',
          name: profile?.name || 'Unknown',
          email: profile?.email || '',
          avatar_url: profile?.avatar_url,
          registered_at: reg.registered_at,
          status: reg.status
        };
      });

      setVolunteers(transformedData);
    } catch (error: any) {
      console.error("Error fetching volunteers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading volunteers...</p>;
  }

  if (volunteers.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No volunteers registered yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {volunteers.map((volunteer) => (
        <Card key={volunteer.id} className="p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={volunteer.avatar_url} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{volunteer.name}</div>
              <div className="text-sm text-muted-foreground">{volunteer.email}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Registered: {new Date(volunteer.registered_at).toLocaleDateString()}
              </div>
            </div>
            <Badge variant={volunteer.status === 'attended' ? 'default' : 'secondary'}>
              {volunteer.status}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
};