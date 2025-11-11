import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar_url: string | null;
  events_joined: number;
  hours_volunteered: number;
  badges: string[];
}

export const Leaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("volunteer_leaderboard")
        .select("*")
        .limit(10);

      if (error) throw error;

      if (data) {
        setLeaders(data);
      }
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="font-semibold text-muted-foreground">#{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">Loading leaderboard...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        Top Volunteers
      </h3>
      <div className="space-y-3">
        {leaders.map((leader, index) => (
          <div
            key={leader.id}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="w-8 flex items-center justify-center">
              {getRankIcon(index)}
            </div>
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={leader.avatar_url || undefined} />
              <AvatarFallback>{leader.name.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <p className="font-medium">{leader.name}</p>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>{leader.hours_volunteered} hours</span>
                <span>•</span>
                <span>{leader.events_joined} events</span>
              </div>
            </div>

            <div className="flex gap-1">
              {leader.badges?.slice(0, 3).map((badge, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
