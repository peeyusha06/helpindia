import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Users, Calendar, TrendingUp, Award, Globe } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">HelpIndia</span>
          </div>
          <div className="flex gap-3">
            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{ background: 'var(--gradient-hero)' }}
        />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Make a Difference Today
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect with meaningful causes, volunteer your time, or support NGOs making real impact across India
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="gap-2">
                  Get Started <Heart className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="p-6 text-center hover:shadow-md transition-all animate-scale-in">
              <Users className="h-12 w-12 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">10,000+</div>
              <div className="text-muted-foreground">Active Volunteers</div>
            </Card>
            <Card className="p-6 text-center hover:shadow-md transition-all animate-scale-in">
              <Globe className="h-12 w-12 text-secondary mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">500+</div>
              <div className="text-muted-foreground">NGO Partners</div>
            </Card>
            <Card className="p-6 text-center hover:shadow-md transition-all animate-scale-in">
              <TrendingUp className="h-12 w-12 text-accent mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">₹50L+</div>
              <div className="text-muted-foreground">Funds Raised</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">How You Can Help</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-8 hover:shadow-lg transition-all group animate-slide-up">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Volunteer</h3>
              <p className="text-muted-foreground mb-4">
                Find meaningful opportunities to contribute your time and skills to causes you care about
              </p>
              <Link to="/signup">
                <Button variant="link" className="px-0">
                  Start Volunteering →
                </Button>
              </Link>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-all group animate-slide-up">
              <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Heart className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Donate</h3>
              <p className="text-muted-foreground mb-4">
                Support campaigns and NGOs with financial contributions that create lasting change
              </p>
              <Link to="/signup">
                <Button variant="link" className="px-0">
                  Make a Donation →
                </Button>
              </Link>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-all group animate-slide-up">
              <div className="h-14 w-14 rounded-full bg-secondary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Award className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Host Events</h3>
              <p className="text-muted-foreground mb-4">
                NGOs can create events, manage volunteers, and track the impact of their initiatives
              </p>
              <Link to="/signup">
                <Button variant="link" className="px-0">
                  Join as NGO →
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">HelpIndia</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Connecting hearts, creating impact
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link to="/login" className="block text-muted-foreground hover:text-foreground">
                  Login
                </Link>
                <Link to="/signup" className="block text-muted-foreground hover:text-foreground">
                  Sign Up
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link to="/privacy" className="block text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="block text-muted-foreground hover:text-foreground">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-8 pt-8 border-t">
            © 2025 HelpIndia. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
