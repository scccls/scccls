import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Target, CheckCircle, FileText } from "lucide-react";

interface WeeklyData {
  week: string;
  questionsAttempted: number;
  questionsCorrect: number;
  testsCompleted: number;
}

interface WeeklyActivityChartProps {
  data: WeeklyData[];
}

const chartConfig = {
  questionsAttempted: {
    label: "Questions Attempted",
    color: "hsl(var(--chart-1))",
  },
  questionsCorrect: {
    label: "Questions Correct",
    color: "hsl(var(--chart-2))",
  },
  testsCompleted: {
    label: "Tests Completed",
    color: "hsl(var(--chart-3))",
  },
};

const WeeklyActivityChart = ({ data }: WeeklyActivityChartProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-blue-500/10">
            <Target className="h-4 w-4 text-blue-500" />
          </div>
          <CardTitle className="text-sm font-medium">Weekly Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="week" 
              tickLine={false} 
              axisLine={false}
              fontSize={12}
            />
            <YAxis 
              tickLine={false} 
              axisLine={false}
              fontSize={12}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar 
              dataKey="questionsAttempted" 
              fill="var(--color-questionsAttempted)" 
              radius={[4, 4, 0, 0]}
              name="questionsAttempted"
            />
            <Bar 
              dataKey="questionsCorrect" 
              fill="var(--color-questionsCorrect)" 
              radius={[4, 4, 0, 0]}
              name="questionsCorrect"
            />
            <Bar 
              dataKey="testsCompleted" 
              fill="var(--color-testsCompleted)" 
              radius={[4, 4, 0, 0]}
              name="testsCompleted"
            />
          </BarChart>
        </ChartContainer>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-[hsl(var(--chart-1))]" />
            <span className="text-muted-foreground">Attempted</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-[hsl(var(--chart-2))]" />
            <span className="text-muted-foreground">Correct</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-[hsl(var(--chart-3))]" />
            <span className="text-muted-foreground">Tests</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyActivityChart;
