import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Percent, Clock } from "lucide-react";

interface WeeklyAverage {
  week: string;
  accuracy: number;
  responseTime: number; // in seconds
}

interface AccuracyResponseChartProps {
  data: WeeklyAverage[];
}

const chartConfig = {
  accuracy: {
    label: "Accuracy %",
    color: "hsl(var(--chart-4))",
  },
  responseTime: {
    label: "Response Time (s)",
    color: "hsl(var(--chart-5))",
  },
};

const AccuracyResponseChart = ({ data }: AccuracyResponseChartProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/10">
            <Percent className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-sm font-medium">Accuracy & Response Time</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="week" 
              tickLine={false} 
              axisLine={false}
              fontSize={12}
            />
            <YAxis 
              yAxisId="left"
              tickLine={false} 
              axisLine={false}
              fontSize={12}
              domain={[0, 100]}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tickLine={false} 
              axisLine={false}
              fontSize={12}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line 
              yAxisId="left"
              type="monotone"
              dataKey="accuracy" 
              stroke="var(--color-accuracy)" 
              strokeWidth={2}
              dot={{ fill: "var(--color-accuracy)", strokeWidth: 2, r: 4 }}
              name="accuracy"
            />
            <Line 
              yAxisId="right"
              type="monotone"
              dataKey="responseTime" 
              stroke="var(--color-responseTime)" 
              strokeWidth={2}
              dot={{ fill: "var(--color-responseTime)", strokeWidth: 2, r: 4 }}
              name="responseTime"
            />
          </LineChart>
        </ChartContainer>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-4))]" />
            <span className="text-muted-foreground">Accuracy %</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-5))]" />
            <span className="text-muted-foreground">Response Time (s)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccuracyResponseChart;
