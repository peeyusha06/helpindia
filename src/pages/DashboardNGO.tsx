import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Plus, Users, Calendar, TrendingUp, LogOut, Edit, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotificationBell } from "@/components/NotificationBell";
import { VolunteersList } from "@/components/VolunteersList";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Event {
  id: string;
  title: string;
  description: string;
  date_time: string;
  location: string;
  capacity: number;
  volunteers_registered: string[];
}

const DashboardNGO = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showVolunteersDialog, setShowVolunteersDialog] = useState(false);

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

    if (roleData?.role !== 'ngo') {
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
        .eq('created_by', user.id)
        .order('date_time', { ascending: false });

      setEvents(eventsData || []);

      const { data: donationsData } = await supabase
        .from('donations')
        .select('*')
        .order('date', { ascending: false })
        .limit(10);

      setDonations(donationsData || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast.success("Event deleted successfully");
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

  const totalVolunteers = events.reduce((sum, e) => sum + (e.volunteers_registered?.length || 0), 0);
  const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount), 0);

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {profile?.name}!</h1>
            <p className="text-muted-foreground">NGO Management Dashboard</p>
          </div>
          <Link to="/create-event">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" /> Create Event
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <Calendar className="h-8 w-8 text-primary mb-3" />
            <div className="text-3xl font-bold">{events.length}</div>
            <div className="text-sm text-muted-foreground">Total Events</div>
          </Card>

          <Card className="p-6">
            <Users className="h-8 w-8 text-secondary mb-3" />
            <div className="text-3xl font-bold">{totalVolunteers}</div>
            <div className="text-sm text-muted-foreground">Total Volunteers</div>
          </Card>

          <Card className="p-6">
            <TrendingUp className="h-8 w-8 text-accent mb-3" />
            <div className="text-3xl font-bold">₹{totalDonations.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Donations</div>
          </Card>
        </div>

        {/* Events Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Your Events</h2>
          </div>
          
          {events.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">You haven't created any events yet</p>
              <Link to="/create-event">
                <Button>Create Your First Event</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold">{event.title}</h3>
                    <div className="flex gap-2">
                      <Link to={`/edit-event/${event.id}`}>
                        <Button size="icon" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">
                        {new Date(event.date_time).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{event.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Volunteers</span>
                      <span className="font-medium">
                        {event.volunteers_registered?.length || 0}/{event.capacity}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowVolunteersDialog(true);
                    }}
                  >
                    View Volunteers
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Donations */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Donations</h2>
          {donations.length === 0 ? (
            <Card className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No donations yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {donations.slice(0, 5).map((donation) => (
                <Card key={donation.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{donation.campaign}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(donation.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xl font-bold text-accent">
                      ₹{Number(donation.amount).toLocaleString()}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Volunteers Dialog */}
      <Dialog open={showVolunteersDialog} onOpenChange={setShowVolunteersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Registered Volunteers - {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <VolunteersList volunteerIds={selectedEvent.volunteers_registered || []} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardNGO;
