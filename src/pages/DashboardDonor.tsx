import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, TrendingUp, DollarSign, Calendar, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotificationBell } from "@/components/NotificationBell";

interface Donation {
  id: string;
  amount: number;
  campaign: string;
  date: string;
  status: string;
}

const DashboardDonor = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [totalDonated, setTotalDonated] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchData();

    // Real-time subscription for donations
    const channel = supabase
      .channel('donor-donations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'donations', filter: `donor_id=eq.${profile?.id}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

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

    if (roleData?.role !== 'donor') {
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

      const { data: donationsData } = await supabase
        .from('donations')
        .select('*')
        .eq('donor_id', user.id)
        .order('date', { ascending: false });

      setDonations(donationsData || []);
      
      const total = donationsData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      setTotalDonated(total);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const goalAmount = 100000;
  const progressPercent = Math.min((totalDonated / goalAmount) * 100, 100);

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
          <p className="text-muted-foreground">Your donor dashboard</p>
        </div>

        {/* Main Stats Card */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-accent/10 to-accent/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Total Contributed</h2>
              <div className="text-4xl font-bold text-accent">₹{totalDonated.toLocaleString()}</div>
            </div>
            <DollarSign className="h-16 w-16 text-accent/30" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to ₹{goalAmount.toLocaleString()} goal</span>
              <span className="font-semibold">{progressPercent.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>

          <Link to="/donate">
            <Button className="w-full mt-6" size="lg">
              Make a Donation
            </Button>
          </Link>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <TrendingUp className="h-8 w-8 text-secondary mb-3" />
            <div className="text-2xl font-bold">{donations.length}</div>
            <div className="text-sm text-muted-foreground">Total Donations</div>
          </Card>

          <Card className="p-6">
            <Calendar className="h-8 w-8 text-primary mb-3" />
            <div className="text-2xl font-bold">
              {donations.length > 0 ? new Date(donations[0].date).toLocaleDateString() : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">Last Donation</div>
          </Card>

          <Card className="p-6">
            <Heart className="h-8 w-8 text-accent mb-3" />
            <div className="text-2xl font-bold">
              {donations.length > 0 ? `₹${Math.round(totalDonated / donations.length).toLocaleString()}` : '₹0'}
            </div>
            <div className="text-sm text-muted-foreground">Average Donation</div>
          </Card>
        </div>

        {/* Recent Donations */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Donations</h2>
          {donations.length === 0 ? (
            <Card className="p-8 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">You haven't made any donations yet</p>
              <Link to="/donate">
                <Button>Make Your First Donation</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {donations.map((donation) => (
                <Card key={donation.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{donation.campaign}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(donation.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-accent">
                        ₹{Number(donation.amount).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {donation.status}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardDonor;
