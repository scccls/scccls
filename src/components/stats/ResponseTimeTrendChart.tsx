import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Clock } from "lucide-react";

interface ResponseTimeData {
  week: string;
  responseTime: number;
}

interface ResponseTimeTrendChartProps {
  data: ResponseTimeData[];
}

const chartConfig = {
  responseTime: {
    label: "Response Time (s)",
    color: "hsl(187, 85%, 43%)",
  },
};

const ResponseTimeTrendChart = ({ data }: ResponseTimeTrendChartProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-cyan-500/10">
            <Clock className="h-4 w-4 text-cyan-500" />
          </div>
          <CardTitle className="text-sm font-medium">Avg Response Time Trend</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[120px] w-full">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            <Line 
              type="monotone"
              dataKey="responseTime" 
              stroke="var(--color-responseTime)" 
              strokeWidth={2}
              dot={{ fill: "var(--color-responseTime)", strokeWidth: 2, r: 4 }}
              name="responseTime"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ResponseTimeTrendChart;
