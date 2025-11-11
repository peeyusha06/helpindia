import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Calendar, Clock, MapPin, Users, Award, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotificationBell } from "@/components/NotificationBell";
import { Leaderboard } from "@/components/Leaderboard";
import { HoursLogger } from "@/components/HoursLogger";
import { EventSearch, SearchFilters } from "@/components/EventSearch";

interface Event {
  id: string;
  title: string;
  description: string;
  date_time: string;
  location: string;
  capacity: number;
  volunteers_registered: string[];
  image_url: string | null;
}

const DashboardVolunteer = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'volunteer') {
      navigate(`/dashboard-${roleData?.role}`);
    }
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'upcoming')
        .order('date_time', { ascending: true });

      setEvents(eventsData || []);
      setFilteredEvents(eventsData || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string, filters: SearchFilters) => {
    let filtered = [...events];

    // Text search
    if (query) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.location.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Date filter
    const now = new Date();
    if (filters.dateFilter === 'week') {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(event => new Date(event.date_time) <= weekFromNow);
    } else if (filters.dateFilter === 'month') {
      const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(event => new Date(event.date_time) <= monthFromNow);
    }

    // Sort
    filtered.sort((a, b) => {
      if (filters.sortBy === 'date') {
        return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
      } else if (filters.sortBy === 'capacity') {
        return b.capacity - a.capacity;
      } else if (filters.sortBy === 'volunteers') {
        return (b.volunteers_registered?.length || 0) - (a.volunteers_registered?.length || 0);
      }
      return 0;
    });

    setFilteredEvents(filtered);
  };

  const handleRegister = async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const event = events.find(e => e.id === eventId);
      if (!event) return;

      if (event.volunteers_registered.includes(user.id)) {
        toast.info("Already registered for this event");
        return;
      }

      const { error } = await supabase
        .from('events')
        .update({
          volunteers_registered: [...event.volunteers_registered, user.id]
        })
        .eq('id', eventId);

      if (error) throw error;

      await supabase
        .from('profiles')
        .update({ events_joined: (profile?.events_joined || 0) + 1 })
        .eq('id', user.id);

      toast.success("Successfully registered for event!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">HelpIndia</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.name}!</h1>
          <p className="text-muted-foreground">Your volunteer dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{profile?.events_joined || 0}</div>
                <div className="text-sm text-muted-foreground">Events Joined</div>
              </div>
            </div>
            <Progress value={(profile?.events_joined || 0) * 10} className="h-2" />
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-8 w-8 text-secondary" />
              <div>
                <div className="text-2xl font-bold">{profile?.hours_volunteered || 0}h</div>
                <div className="text-sm text-muted-foreground">Hours Contributed</div>
              </div>
            </div>
            <Progress value={(profile?.hours_volunteered || 0) / 2} className="h-2" />
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Award className="h-8 w-8 text-accent" />
              <div>
                <div className="text-2xl font-bold">{profile?.badges?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Badges Earned</div>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              {profile?.badges?.slice(0, 3).map((badge: string, i: number) => (
                <div key={i} className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Award className="h-4 w-4 text-accent" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Leaderboard */}
        <div className="mb-8">
          <Leaderboard />
        </div>

        {/* Find Opportunities Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Find Opportunities</h2>
          <div className="mb-6">
            <EventSearch onSearch={handleSearch} />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const isRegistered = profile && event.volunteers_registered?.includes(profile.id);
              
              return (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-all">
                  {event.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-3">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(event.date_time).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{event.volunteers_registered?.length || 0}/{event.capacity} volunteers</span>
                    </div>
                  </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleRegister(event.id)}
                        disabled={isRegistered}
                        className="flex-1"
                        variant={isRegistered ? "outline" : "default"}
                      >
                        {isRegistered ? "Registered ✓" : "Register"}
                      </Button>
                      {isRegistered && (
                        <HoursLogger
                          eventId={event.id}
                          eventTitle={event.title}
                          onHoursLogged={fetchData}
                        />
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardVolunteer;
