import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Flame, Target, CheckCircle, FileText, Percent, Clock } from "lucide-react";
interface Stats {
  dailyStreak: number;
  questionsAttempted: number;
  questionsCorrect: number;
  testsCompleted: number;
  overallPercentage: number;
  averageResponseTimeMs: number | null;
}
const AccountStats = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    dailyStreak: 0,
    questionsAttempted: 0,
    questionsCorrect: 0,
    testsCompleted: 0,
    overallPercentage: 0,
    averageResponseTimeMs: null
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setLoading(true);

      // Fetch question attempts
      const {
        data: attempts,
        error: attemptsError
      } = await supabase.from("question_attempts").select("is_correct, response_time_ms").eq("user_id", user.id);
      if (attemptsError) {
        console.error("Error fetching attempts:", attemptsError);
      }
      const questionsAttempted = attempts?.length || 0;
      const questionsCorrect = attempts?.filter(a => a.is_correct).length || 0;
      const overallPercentage = questionsAttempted > 0 ? Math.round(questionsCorrect / questionsAttempted * 100) : 0;
      
      // Calculate average response time
      const attemptsWithTime = attempts?.filter(a => a.response_time_ms !== null) || [];
      const averageResponseTimeMs = attemptsWithTime.length > 0 
        ? attemptsWithTime.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / attemptsWithTime.length
        : null;

      // Fetch test sessions
      const {
        data: tests,
        error: testsError
      } = await supabase.from("test_sessions").select("id").eq("user_id", user.id);
      if (testsError) {
        console.error("Error fetching tests:", testsError);
      }
      const testsCompleted = tests?.length || 0;

      // Calculate daily streak (only days with 10+ questions count)
      const {
        data: activities,
        error: activitiesError
      } = await supabase.from("daily_activity").select("activity_date, questions_attempted").eq("user_id", user.id).gte("questions_attempted", 10).order("activity_date", {
        ascending: false
      });
      if (activitiesError) {
        console.error("Error fetching activities:", activitiesError);
      }
      let dailyStreak = 0;
      if (activities && activities.length > 0) {
        // Get today's date in YYYY-MM-DD format (local timezone)
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Get yesterday's date string
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        // Create a Set of activity dates (these are already YYYY-MM-DD strings from the database)
        const activityDates = new Set(activities.map(a => a.activity_date));

        // Streak only counts if user was active today or yesterday
        if (activityDates.has(todayStr) || activityDates.has(yesterdayStr)) {
          // Start checking from today or yesterday (whichever has activity)
          let checkDate = new Date(today);
          if (!activityDates.has(todayStr)) {
            checkDate.setDate(checkDate.getDate() - 1);
          }

          // Count consecutive days
          while (true) {
            const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
            if (activityDates.has(checkStr)) {
              dailyStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
        }
      }
      setStats({
        dailyStreak,
        questionsAttempted,
        questionsCorrect,
        testsCompleted,
        overallPercentage,
        averageResponseTimeMs
      });
      setLoading(false);
    };
    fetchStats();
  }, [user]);
  const formatResponseTime = (ms: number | null) => {
    if (ms === null) return "No data";
    if (ms >= 60000) return `${(ms / 60000).toFixed(1)} min`;
    return `${(ms / 1000).toFixed(1)} sec`;
  };

  const statCards = [{
    title: "Daily Streak",
    subtitle: "(10 question attempts required)",
    value: stats.dailyStreak,
    suffix: stats.dailyStreak === 1 ? "day" : "days",
    icon: Flame,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10"
  }, {
    title: "Overall Accuracy",
    value: stats.overallPercentage,
    suffix: "%",
    icon: Percent,
    color: "text-primary",
    bgColor: "bg-primary/10"
  }, {
    title: "Questions Correct",
    value: stats.questionsCorrect,
    suffix: "",
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  }, {
    title: "Questions Attempted",
    value: stats.questionsAttempted,
    suffix: "",
    icon: Target,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  }, {
    title: "Tests Completed",
    value: stats.testsCompleted,
    suffix: "",
    icon: FileText,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  }, {
    title: "Avg Response Time",
    value: formatResponseTime(stats.averageResponseTimeMs),
    suffix: "",
    icon: Clock,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    isText: true
  }];
  if (loading) {
    return <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="max-w-4xl mx-auto space-y-6">
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
        {statCards.map(stat => <Card key={stat.title}>
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
                {(stat as any).isText ? stat.value : (
                  <>
                    {stat.value}
                    {stat.suffix && <span className="text-lg ml-1 text-muted-foreground">{stat.suffix}</span>}
                  </>
                )}
              </div>
            </CardContent>
          </Card>)}
      </div>

      
    </div>;
};
export default AccountStats;