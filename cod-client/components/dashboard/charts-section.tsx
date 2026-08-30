"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDonutChart } from "./status-donut-chart";
import { StatusBarChart } from "./status-bar-chart";
import type { OrderStatus } from "../../../cod-shared/db/schema";

interface ChartsSectionProps {
  data: Array<{ status: OrderStatus; count: number }>;
  className?: string;
}

export function ChartsSection({ data, className }: ChartsSectionProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className ?? ""}`}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            توزيع الحالات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatusDonutChart data={data} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            الحالات حسب العدد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatusBarChart data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
