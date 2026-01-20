import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface DailyActivity {
  activity_date: string;
  questions_attempted: number;
}

interface DailyStreakGridProps {
  activities: DailyActivity[];
}

const DailyStreakGrid = ({ activities }: DailyStreakGridProps) => {
  // Create a map of dates to activity
  const activityMap = new Map<string, number>();
  activities.forEach(a => {
    activityMap.set(a.activity_date, a.questions_attempted);
  });

  // Generate last 28 days
  const days: { date: string; active: boolean }[] = [];
  const today = new Date();
  
  for (let i = 27; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const attempted = activityMap.get(dateStr) || 0;
    days.push({
      date: dateStr,
      active: attempted >= 10,
    });
  }

  const activeDays = days.filter(d => d.active).length;

  // Group by weeks (7 days each)
  const weeks: typeof days[] = [];
  for (let i = 0; i < 4; i++) {
    weeks.push(days.slice(i * 7, (i + 1) * 7));
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-orange-500/10">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <CardTitle className="text-sm font-medium">Daily Streak Trend</CardTitle>
          </div>
          <span className="text-sm font-semibold text-orange-500">{activeDays}/28 days</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={day.date}
                  className={`flex-1 aspect-square rounded-sm ${
                    day.active 
                      ? 'bg-orange-500' 
                      : 'bg-muted'
                  }`}
                  title={`${day.date}: ${activityMap.get(day.date) || 0} questions`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>4 weeks ago</span>
          <span>Today</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyStreakGrid;
