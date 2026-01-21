import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { LucideIcon } from "lucide-react";

interface WeeklyBarChartData {
  week: string;
  value: number;
}

interface WeeklyBarChartProps {
  title: string;
  data: WeeklyBarChartData[];
  icon: LucideIcon;
  color: string;
  bgColor: string;
  chartColor: string;
}

const WeeklyBarChart = ({ title, data, icon: Icon, color, bgColor, chartColor }: WeeklyBarChartProps) => {
  const chartConfig = {
    value: {
      label: title,
      color: chartColor,
    },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full ${bgColor}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <CardTitle className="text-sm font-medium">{title} Trend</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[120px] w-full">
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
              dataKey="value" 
              fill={chartColor}
              radius={[4, 4, 0, 0]}
              name="value"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default WeeklyBarChart;
