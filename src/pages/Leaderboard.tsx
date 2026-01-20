import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  username: string;
  questions_attempted: number;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Fetch leaderboard data using the security definer function
      const { data, error } = await supabase.rpc('get_weekly_leaderboard');
      
      if (error) {
        console.error("Error fetching leaderboard:", error);
      } else {
        setEntries(data || []);
      }

      // Get current user's username
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', user.id)
          .single();
        
        if (profileData) {
          setCurrentUsername(profileData.username);
        }
      }

      setLoading(false);
    };

    fetchLeaderboard();
  }, [user]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-muted-foreground font-medium">{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Weekly Leaderboard
          </CardTitle>
          <CardDescription>
            Questions attempted in the past 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No activity recorded yet. Start practicing to appear on the leaderboard!
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div
                  key={entry.username}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    entry.username === currentUsername
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(index)}
                    <span className={`font-medium ${
                      entry.username === currentUsername ? "text-primary" : ""
                    }`}>
                      {entry.username}
                      {entry.username === currentUsername && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </span>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {entry.questions_attempted.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
