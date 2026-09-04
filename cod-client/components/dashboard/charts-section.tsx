"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDonutChart } from "./status-donut-chart";
import { StatusBarChart } from "./status-bar-chart";
import { RevenueChart } from "./revenue-chart";
import { OrdersChart } from "./orders-chart";
import { WilayaChart } from "./wilaya-chart";
import { RecentOrders } from "./recent-orders";
import type { OrderStatus } from "../../../cod-shared/db/schema";
import type { DailyRevenue, DailyOrders, WilayaStat, RecentOrder } from "@/../cod-shared/queries/analytics";

interface ChartsSectionProps {
  data: Array<{ status: OrderStatus; count: number }>;
  revenueData: DailyRevenue[];
  ordersData: DailyOrders[];
  wilayaData: WilayaStat[];
  recentOrders: RecentOrder[];
  className?: string;
}

export function ChartsSection({
  data,
  revenueData,
  ordersData,
  wilayaData,
  recentOrders,
  className,
}: ChartsSectionProps) {
  return (
    <div className={`space-y-6 ${className ?? ""}`}>
      {/* Row 1: Revenue + Orders over time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              الإيرادات (30 يوم)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              الطلبات (30 يوم)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersChart data={ordersData} />
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Status donut + Bar chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Row 3: Wilaya distribution + Recent orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              توزيع الطلبات حسب الولاية (أعلى 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WilayaChart data={wilayaData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              أحدث الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentOrders data={recentOrders} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
