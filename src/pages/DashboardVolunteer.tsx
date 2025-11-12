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
  image_url: string | null;
}

const DashboardVolunteer = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchData();
    
    // Real-time subscription for new events
    const eventsChannel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => fetchData()
      )
      .subscribe();

    // Real-time subscription for registrations
    const registrationsChannel = supabase
      .channel('registrations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'volunteer_registrations' },
        () => fetchUserRegistrations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(registrationsChannel);
    };
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
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true });

      setEvents(eventsData || []);
      setFilteredEvents(eventsData || []);
      
      await fetchUserRegistrations();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRegistrations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: registrations } = await supabase
        .from('volunteer_registrations')
        .select('event_id')
        .eq('user_id', user.id);

      if (registrations) {
        setRegisteredEventIds(new Set(registrations.map(r => r.event_id)));
      }
    } catch (error: any) {
      console.error("Error fetching registrations:", error);
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
      }
      return 0;
    });

    setFilteredEvents(filtered);
  };

  const handleRegister = async (eventId: string) => {
    if (registeringEventId) return; // Prevent double-clicks
    
    try {
      setRegisteringEventId(eventId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to register for events");
        return;
      }

      // Check if already registered
      if (registeredEventIds.has(eventId)) {
        toast.error("You've already registered for this event");
        return;
      }

      const event = events.find(e => e.id === eventId);
      if (!event) return;

      // Check capacity
      const { count } = await supabase
        .from('volunteer_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      if (count && count >= event.capacity) {
        toast.error("This event is already at full capacity");
        return;
      }

      // Register volunteer
      const { error } = await supabase
        .from('volunteer_registrations')
        .insert({
          user_id: user.id,
          event_id: eventId
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error("You've already registered for this event");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Successfully registered for event!");
      await fetchUserRegistrations();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setRegisteringEventId(null);
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
              const isRegistered = registeredEventIds.has(event.id);
              
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
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium">
                        {isRegistered ? (
                          <span className="text-green-600 flex items-center gap-1">
                            ✅ Registered
                          </span>
                        ) : (
                          <span className="text-muted-foreground">🕒 Available</span>
                        )}
                      </span>
                    </div>
                  </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleRegister(event.id)}
                        disabled={isRegistered || registeringEventId === event.id}
                        className="flex-1"
                        variant={isRegistered ? "outline" : "default"}
                      >
                        {registeringEventId === event.id
                          ? "Registering..."
                          : isRegistered
                          ? "Already Registered"
                          : "Register Now"}
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