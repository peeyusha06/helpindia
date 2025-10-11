import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Users, DollarSign, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'volunteer' | 'donor' | 'ngo' | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast.error("Please select your role");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if user has the selected role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (roleData?.role !== selectedRole) {
          await supabase.auth.signOut();
          toast.error(`This account is registered as a ${roleData?.role}, not a ${selectedRole}`);
          return;
        }

        toast.success("Login successful!");
        navigate(`/dashboard-${selectedRole}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <Heart className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">HelpIndia</span>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Choose your role to continue</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card 
              className="p-8 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary group"
              onClick={() => setSelectedRole('volunteer')}
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform mx-auto">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Volunteer</h3>
              <p className="text-sm text-muted-foreground text-center">
                Find and join meaningful events
              </p>
            </Card>

            <Card 
              className="p-8 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-accent group"
              onClick={() => setSelectedRole('donor')}
            >
              <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform mx-auto">
                <DollarSign className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Donor</h3>
              <p className="text-sm text-muted-foreground text-center">
                Support causes you care about
              </p>
            </Card>

            <Card 
              className="p-8 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-secondary group"
              onClick={() => setSelectedRole('ngo')}
            >
              <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform mx-auto">
                <Building2 className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">NGO</h3>
              <p className="text-sm text-muted-foreground text-center">
                Create and manage events
              </p>
            </Card>
          </div>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">HelpIndia</span>
          </Link>
          <h1 className="text-2xl font-bold">Login as {selectedRole}</h1>
          <Button 
            variant="link" 
            onClick={() => setSelectedRole(null)}
            className="text-sm"
          >
            Change role
          </Button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="text-center mt-4 text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Login;
