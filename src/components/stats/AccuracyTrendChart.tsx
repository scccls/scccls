import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Percent } from "lucide-react";

interface AccuracyData {
  week: string;
  accuracy: number;
}

interface AccuracyTrendChartProps {
  data: AccuracyData[];
}

const chartConfig = {
  accuracy: {
    label: "Accuracy %",
    color: "hsl(var(--primary))",
  },
};

const AccuracyTrendChart = ({ data }: AccuracyTrendChartProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/10">
            <Percent className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-sm font-medium">Overall Accuracy Trend</CardTitle>
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
              domain={[0, 100]}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line 
              type="monotone"
              dataKey="accuracy" 
              stroke="var(--color-accuracy)" 
              strokeWidth={2}
              dot={{ fill: "var(--color-accuracy)", strokeWidth: 2, r: 4 }}
              name="accuracy"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default AccuracyTrendChart;
