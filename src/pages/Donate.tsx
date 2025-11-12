import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { donationSchema } from "@/lib/validations";

const Donate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState("");
  const [campaign, setCampaign] = useState("General Fund");
  const [selectedNgo, setSelectedNgo] = useState("");
  const [ngos, setNgos] = useState<any[]>([]);
  const presetAmounts = [500, 1000, 2500, 5000];

  useEffect(() => {
    checkAuth();
    fetchNgos();
  }, []);

  const fetchNgos = async () => {
    try {
      const { data: ngoRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'ngo');

      if (ngoRoles && ngoRoles.length > 0) {
        const ngoIds = ngoRoles.map(r => r.user_id);
        const { data: ngoProfiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', ngoIds);

        setNgos(ngoProfiles || []);
        if (ngoProfiles && ngoProfiles.length > 0) {
          setSelectedNgo(ngoProfiles[0].id);
        }
      }
    } catch (error: any) {
      console.error('Error fetching NGOs:', error);
    }
  };

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
      toast.error("Only donors can make donations");
      navigate('/');
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const donationAmount = parseFloat(amount);

      // Validate inputs
      const validation = donationSchema.safeParse({
        amount: donationAmount,
        campaign
      });

      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast.error(firstError.message);
        return;
      }

      if (!selectedNgo) {
        toast.error("Please select an NGO to donate to");
        return;
      }

      // Use RPC function to create donation and notifications atomically
      const { data, error } = await supabase.rpc('create_donation_and_notify', {
        p_donor_id: user.id,
        p_ngo_id: selectedNgo,
        p_amount: validation.data.amount,
        p_campaign: validation.data.campaign
      });

      if (error) throw error;

      setSuccess(true);
      const ngoName = ngos.find(n => n.id === selectedNgo)?.name || "the organization";
      toast.success(`Thank you! Your donation of ₹${amount} to ${ngoName} has been received.`);
      
      // Reset after 3 seconds
      setTimeout(() => {
        navigate('/dashboard-donor');
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || "Donation failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full p-8 text-center animate-scale-in">
          <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-secondary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p className="text-muted-foreground mb-4">
            Your donation of ₹{amount} has been processed successfully.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to dashboard...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard-donor" className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">HelpIndia</span>
          </Link>
          <Link to="/dashboard-donor">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Make a Donation</h1>
          <p className="text-muted-foreground">Your contribution makes a real difference</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleDonate} className="space-y-6">
            <div>
              <Label className="text-lg mb-3">Select Amount</Label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={amount === preset.toString() ? "default" : "outline"}
                    onClick={() => setAmount(preset.toString())}
                    className="h-16 text-lg"
                  >
                    ₹{preset.toLocaleString()}
                  </Button>
                ))}
              </div>
              <Label htmlFor="custom-amount">Or enter custom amount</Label>
              <Input
                id="custom-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                required
                className="text-lg"
              />
            </div>

            <div>
              <Label htmlFor="ngo">Select NGO</Label>
              <select
                id="ngo"
                value={selectedNgo}
                onChange={(e) => setSelectedNgo(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                required
              >
                {ngos.length === 0 && <option value="">No NGOs available</option>}
                {ngos.map((ngo) => (
                  <option key={ngo.id} value={ngo.id}>
                    {ngo.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="campaign">Campaign</Label>
              <select
                id="campaign"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="General Fund">General Fund</option>
                <option value="Education">Education</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Environment">Environment</option>
                <option value="Disaster Relief">Disaster Relief</option>
              </select>
            </div>

            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-2">Your Impact</h3>
              <p className="text-sm text-muted-foreground">
                Your donation of ₹{amount || "0"} will help support {campaign.toLowerCase()} initiatives
                and create lasting change in communities across India.
              </p>
            </Card>

            <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
              {loading ? "Processing..." : `Donate ₹${amount || "0"}`}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Note: This is a demo. No actual payment will be processed.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Donate;
