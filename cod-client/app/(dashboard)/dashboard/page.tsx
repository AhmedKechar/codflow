import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import {
  getDashboardStats,
  getDashboardRevenue,
  getDashboardDailyOrders,
  getDashboardWilayaStats,
  getDashboardRecentOrders,
} from "@/actions/analytics";
import type {
  OrderStatusStat,
  DailyRevenue,
  DailyOrders,
  WilayaStat,
  RecentOrder,
} from "@/../cod-shared/queries/analytics";

export default async function DashboardPage() {
  const [statusStats, revenueData, ordersData, wilayaData, recentOrders] =
    await Promise.all([
      getDashboardStats().catch((): OrderStatusStat[] => []),
      getDashboardRevenue().catch((): DailyRevenue[] => []),
      getDashboardDailyOrders().catch((): DailyOrders[] => []),
      getDashboardWilayaStats().catch((): WilayaStat[] => []),
      getDashboardRecentOrders().catch((): RecentOrder[] => []),
    ]);

  return (
    <ProtectedRoute requiredScope={SCOPES.DASHBOARD_VIEW}>
      <DashboardClient
        statusStats={statusStats}
        revenueData={revenueData}
        ordersData={ordersData}
        wilayaData={wilayaData}
        recentOrders={recentOrders}
      />
    </ProtectedRoute>
  );
}
