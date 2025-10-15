import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Users, DollarSign, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { signupSchema } from "@/lib/validations";

const Signup = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'volunteer' | 'donor' | 'ngo' | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast.error("Please select your role");
      return;
    }

    // Validate inputs
    const validation = signupSchema.safeParse({
      name,
      email,
      password,
      role: selectedRole
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);
    try {
      // Sign up user
      const { data, error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          data: { name: validation.data.name },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Call Edge Function to assign role securely
        const { data: roleData, error: roleError } = await supabase.functions.invoke('assign-user-role', {
          body: { 
            userId: data.user.id, 
            requestedRole: validation.data.role 
          }
        });

        if (roleError) throw roleError;

        toast.success("Account created successfully!");
        navigate(`/dashboard-${roleData.role}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
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
            <h1 className="text-3xl font-bold mb-2">Join HelpIndia</h1>
            <p className="text-muted-foreground">Choose how you want to make an impact</p>
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
                Contribute your time and skills to meaningful causes
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
                Support initiatives with financial contributions
              </p>
            </Card>

            <Card className="p-8 border-2 border-muted cursor-not-allowed opacity-60">
              <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4 mx-auto">
                <Building2 className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">NGO</h3>
              <p className="text-sm text-muted-foreground text-center">
                Requires verification - Contact support
              </p>
            </Card>
          </div>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Login
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
          <h1 className="text-2xl font-bold">Sign up as {selectedRole}</h1>
          <Button 
            variant="link" 
            onClick={() => setSelectedRole(null)}
            className="text-sm"
          >
            Change role
          </Button>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
            />
          </div>

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
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center mt-4 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Signup;
