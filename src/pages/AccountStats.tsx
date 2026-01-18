import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Flame, Target, CheckCircle, FileText, Percent } from "lucide-react";

interface Stats {
  dailyStreak: number;
  questionsAttempted: number;
  questionsCorrect: number;
  testsCompleted: number;
  overallPercentage: number;
}

const AccountStats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    dailyStreak: 0,
    questionsAttempted: 0,
    questionsCorrect: 0,
    testsCompleted: 0,
    overallPercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      setLoading(true);

      // Fetch question attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from("question_attempts")
        .select("is_correct")
        .eq("user_id", user.id);

      if (attemptsError) {
        console.error("Error fetching attempts:", attemptsError);
      }

      const questionsAttempted = attempts?.length || 0;
      const questionsCorrect = attempts?.filter((a) => a.is_correct).length || 0;
      const overallPercentage = questionsAttempted > 0 
        ? Math.round((questionsCorrect / questionsAttempted) * 100) 
        : 0;

      // Fetch test sessions
      const { data: tests, error: testsError } = await supabase
        .from("test_sessions")
        .select("id")
        .eq("user_id", user.id);

      if (testsError) {
        console.error("Error fetching tests:", testsError);
      }

      const testsCompleted = tests?.length || 0;

      // Calculate daily streak (only days with 10+ questions count)
      const { data: activities, error: activitiesError } = await supabase
        .from("daily_activity")
        .select("activity_date, questions_attempted")
        .eq("user_id", user.id)
        .gte("questions_attempted", 10)
        .order("activity_date", { ascending: false });

      if (activitiesError) {
        console.error("Error fetching activities:", activitiesError);
      }

      let dailyStreak = 0;
      if (activities && activities.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let checkDate = new Date(today);
        
        // Check if user was active today or yesterday to start counting
        const firstActivityDate = new Date(activities[0].activity_date);
        firstActivityDate.setHours(0, 0, 0, 0);
        
        const diffFromToday = Math.floor((today.getTime() - firstActivityDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffFromToday <= 1) {
          // Start from today or yesterday
          if (diffFromToday === 1) {
            checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - 1);
          }
          
          const activityDates = new Set(
            activities.map((a) => new Date(a.activity_date).toISOString().split("T")[0])
          );
          
          while (activityDates.has(checkDate.toISOString().split("T")[0])) {
            dailyStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          }
        }
      }

      setStats({
        dailyStreak,
        questionsAttempted,
        questionsCorrect,
        testsCompleted,
        overallPercentage,
      });

      setLoading(false);
    };

    fetchStats();
  }, [user]);

  const statCards = [
    {
      title: "Daily Streak",
      subtitle: "(10 questions required)",
      value: stats.dailyStreak,
      suffix: stats.dailyStreak === 1 ? "day" : "days",
      icon: Flame,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Overall Accuracy",
      value: stats.overallPercentage,
      suffix: "%",
      icon: Percent,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Questions Correct",
      value: stats.questionsCorrect,
      suffix: "",
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Questions Attempted",
      value: stats.questionsAttempted,
      suffix: "",
      icon: Target,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Tests Completed",
      value: stats.testsCompleted,
      suffix: "",
      icon: FileText,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Account Stats</h1>
          <p className="text-muted-foreground">Track your learning progress</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.subtitle && <p className="text-xs text-muted-foreground">{stat.subtitle}</p>}
              </div>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stat.value}
                {stat.suffix && <span className="text-lg ml-1 text-muted-foreground">{stat.suffix}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How Streaks Work</CardTitle>
          <CardDescription>Keep learning every day to build your streak!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your daily streak increases when you answer at least 10 questions on consecutive days. 
            Missing a day will reset your streak to zero. Stay consistent to build an impressive streak!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountStats;
