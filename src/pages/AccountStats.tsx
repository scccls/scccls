import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Flame, Target, CheckCircle, FileText, Percent, Clock } from "lucide-react";
import DailyStreakGrid from "@/components/stats/DailyStreakGrid";
import AccuracyTrendChart from "@/components/stats/AccuracyTrendChart";
import WeeklyBarChart from "@/components/stats/WeeklyBarChart";
import ResponseTimeTrendChart from "@/components/stats/ResponseTimeTrendChart";

interface Stats {
  dailyStreak: number;
  questionsAttempted: number;
  questionsCorrect: number;
  testsCompleted: number;
  overallPercentage: number;
  averageResponseTimeMs: number | null;
}

interface DailyActivity {
  activity_date: string;
  questions_attempted: number;
  questions_correct: number;
}

interface WeeklyData {
  week: string;
  questionsAttempted: number;
  questionsCorrect: number;
  testsCompleted: number;
}

interface WeeklyAverage {
  week: string;
  accuracy: number;
  responseTime: number;
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
    averageResponseTimeMs: null
  });
  const [loading, setLoading] = useState(true);
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [weeklyAverages, setWeeklyAverages] = useState<WeeklyAverage[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setLoading(true);

      // Calculate date 28 days ago
      const today = new Date();
      const fourWeeksAgo = new Date(today);
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const fourWeeksAgoStr = `${fourWeeksAgo.getFullYear()}-${String(fourWeeksAgo.getMonth() + 1).padStart(2, '0')}-${String(fourWeeksAgo.getDate()).padStart(2, '0')}`;

      // Fetch question attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from("question_attempts")
        .select("is_correct, response_time_ms, created_at")
        .eq("user_id", user.id);
      
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
      const { data: tests, error: testsError } = await supabase
        .from("test_sessions")
        .select("id, completed_at")
        .eq("user_id", user.id);
      
      if (testsError) {
        console.error("Error fetching tests:", testsError);
      }
      const testsCompleted = tests?.length || 0;

      // Fetch daily activity for last 28 days (for both streak and grid)
      const { data: activities, error: activitiesError } = await supabase
        .from("daily_activity")
        .select("activity_date, questions_attempted, questions_correct")
        .eq("user_id", user.id)
        .gte("activity_date", fourWeeksAgoStr)
        .order("activity_date", { ascending: false });

      if (activitiesError) {
        console.error("Error fetching activities:", activitiesError);
      }

      setDailyActivities(activities || []);

      // Calculate daily streak (only days with 10+ questions count)
      const activeActivities = (activities || []).filter(a => a.questions_attempted >= 10);
      let dailyStreak = 0;
      if (activeActivities.length > 0) {
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        const activityDates = new Set(activeActivities.map(a => a.activity_date));

        if (activityDates.has(todayStr) || activityDates.has(yesterdayStr)) {
          let checkDate = new Date(today);
          if (!activityDates.has(todayStr)) {
            checkDate.setDate(checkDate.getDate() - 1);
          }

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

      // Calculate weekly data for bar chart
      const weeklyDataCalc: WeeklyData[] = [];
      const activityMap = new Map<string, DailyActivity>();
      (activities || []).forEach(a => activityMap.set(a.activity_date, a));

      for (let w = 3; w >= 0; w--) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - (w * 7 + 6));
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() - (w * 7));

        let weekAttempted = 0;
        let weekCorrect = 0;

        for (let d = 0; d < 7; d++) {
          const date = new Date(weekStart);
          date.setDate(date.getDate() + d);
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const activity = activityMap.get(dateStr);
          if (activity) {
            weekAttempted += activity.questions_attempted;
            weekCorrect += activity.questions_correct;
          }
        }

        // Count tests in this week
        const weekTests = (tests || []).filter(t => {
          const testDate = new Date(t.completed_at);
          return testDate >= weekStart && testDate <= weekEnd;
        }).length;

        weeklyDataCalc.push({
          week: w === 0 ? "This Week" : w === 1 ? "Last Week" : `${w + 1}w ago`,
          questionsAttempted: weekAttempted,
          questionsCorrect: weekCorrect,
          testsCompleted: weekTests,
        });
      }
      setWeeklyData(weeklyDataCalc);

      // Calculate weekly averages for line chart
      const weeklyAvgCalc: WeeklyAverage[] = [];
      
      for (let w = 3; w >= 0; w--) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - (w * 7 + 6));
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() - (w * 7));
        weekEnd.setHours(23, 59, 59, 999);

        // Filter attempts for this week
        const weekAttempts = (attempts || []).filter(a => {
          const attemptDate = new Date(a.created_at);
          return attemptDate >= weekStart && attemptDate <= weekEnd;
        });

        const weekCorrect = weekAttempts.filter(a => a.is_correct).length;
        const accuracy = weekAttempts.length > 0 
          ? Math.round((weekCorrect / weekAttempts.length) * 100) 
          : 0;

        const attemptsWithTimeInWeek = weekAttempts.filter(a => a.response_time_ms !== null);
        const avgResponseMs = attemptsWithTimeInWeek.length > 0
          ? attemptsWithTimeInWeek.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / attemptsWithTimeInWeek.length
          : 0;

        weeklyAvgCalc.push({
          week: w === 0 ? "This Week" : w === 1 ? "Last Week" : `${w + 1}w ago`,
          accuracy,
          responseTime: Math.round(avgResponseMs / 1000 * 10) / 10, // Convert to seconds with 1 decimal
        });
      }
      setWeeklyAverages(weeklyAvgCalc);

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
        {statCards.map(stat => (
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
                {(stat as any).isText ? stat.value : (
                  <>
                    {stat.value}
                    {stat.suffix && <span className="text-lg ml-1 text-muted-foreground">{stat.suffix}</span>}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Trends (Last 4 Weeks)</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <DailyStreakGrid activities={dailyActivities} />
          <AccuracyTrendChart data={weeklyAverages.map(w => ({ week: w.week, accuracy: w.accuracy }))} />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <WeeklyBarChart 
            title="Questions Correct"
            data={weeklyData.map(w => ({ week: w.week, value: w.questionsCorrect }))}
            icon={CheckCircle}
            color="text-green-500"
            bgColor="bg-green-500/10"
            chartColor="hsl(142, 76%, 36%)"
          />
          <WeeklyBarChart 
            title="Questions Attempted"
            data={weeklyData.map(w => ({ week: w.week, value: w.questionsAttempted }))}
            icon={Target}
            color="text-blue-500"
            bgColor="bg-blue-500/10"
            chartColor="hsl(217, 91%, 60%)"
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <WeeklyBarChart 
            title="Tests Completed"
            data={weeklyData.map(w => ({ week: w.week, value: w.testsCompleted }))}
            icon={FileText}
            color="text-purple-500"
            bgColor="bg-purple-500/10"
            chartColor="hsl(270, 50%, 60%)"
          />
          <ResponseTimeTrendChart data={weeklyAverages.map(w => ({ week: w.week, responseTime: w.responseTime }))} />
        </div>
      </div>
    </div>
  );
};

export default AccountStats;
