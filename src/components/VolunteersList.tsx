import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

interface Volunteer {
  id: string;
  name: string;
  avatar_url: string | null;
  hours_volunteered: number;
  events_joined: number;
}

interface VolunteersListProps {
  volunteerIds: string[];
}

export const VolunteersList = ({ volunteerIds }: VolunteersListProps) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (volunteerIds.length > 0) {
      fetchVolunteers();
    } else {
      setLoading(false);
    }
  }, [volunteerIds]);

  const fetchVolunteers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, hours_volunteered, events_joined")
        .in("id", volunteerIds);

      if (error) throw error;

      if (data) {
        setVolunteers(data);
      }
    } catch (error: any) {
      console.error("Error fetching volunteers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading volunteers...</p>;
  }

  if (volunteers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No volunteers registered yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {volunteers.map((volunteer) => (
        <Card key={volunteer.id} className="p-4">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={volunteer.avatar_url || undefined} />
              <AvatarFallback>{volunteer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{volunteer.name}</p>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>{volunteer.hours_volunteered} total hours</span>
                <span>•</span>
                <span>{volunteer.events_joined} events joined</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
