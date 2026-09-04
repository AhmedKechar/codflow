import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { getUserScopes } from "@/lib/auth";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import { OrdersView } from "@/components/orders/orders-view";
import { getOrdersPaginated, getOrderStatusCounts } from "@/actions/orders";
import { getDrivers, getStoreDriverWilayas } from "@/actions/drivers";
import { getDeliveryCompanies } from "@/actions/delivery-companies";
import type { OrderFilters } from "@/../cod-shared/queries/orders";
import type { OrderStatus } from "@/types/order.types";

const PENDING_STATUSES: OrderStatus[] = ["unreachable", "busy", "postponed"];

interface OrdersPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    group?: string;
    wilayaId?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  // ⚡ Build filters from URL params
  const filters: OrderFilters = {
    limit: pageSize,
    offset,
  };

  // Handle multi-status group (e.g. "pending" = unreachable + busy + postponed)
  if (params.group === "pending") {
    filters.statuses = PENDING_STATUSES;
  } else if (params.status && params.status !== "all") {
    filters.status = params.status as OrderStatus;
  }

  if (params.q) {
    filters.search = params.q;
  }

  if (params.wilayaId) {
    filters.wilayaId = Number(params.wilayaId);
  }

  if (params.startDate) {
    filters.startDate = params.startDate;
  }

  if (params.endDate) {
    filters.endDate = params.endDate;
  }

  // Filters for status counts — same as above but WITHOUT status/statuses filter
  const filtersForCounts: Pick<OrderFilters, "wilayaId" | "search" | "startDate" | "endDate"> = {
    wilayaId: filters.wilayaId,
    search: filters.search,
    startDate: filters.startDate,
    endDate: filters.endDate,
  };

  const [userScopes, ordersResult, driversResult, companiesResult, statusCountsResult, driverWilayasResult] =
    await Promise.allSettled([
      getUserScopes(),
      getOrdersPaginated(filters),
      getDrivers(),
      getDeliveryCompanies(true),
      getOrderStatusCounts(filtersForCounts),
      getStoreDriverWilayas(),
    ]);

  return (
    <ProtectedRoute requiredScope={SCOPES.ORDERS_READ}>
      <OrdersView
        orders={ordersResult.status === "fulfilled" ? ordersResult.value.data : []}
        total={ordersResult.status === "fulfilled" ? ordersResult.value.total : 0}
        currentPage={page}
        pageSize={pageSize}
        drivers={driversResult.status === "fulfilled" ? driversResult.value : []}
        companies={companiesResult.status === "fulfilled" ? companiesResult.value : []}
        driverWilayas={driverWilayasResult.status === "fulfilled" ? driverWilayasResult.value : []}
        userScopes={userScopes.status === "fulfilled" ? userScopes.value : []}
        statusCounts={statusCountsResult.status === "fulfilled" ? statusCountsResult.value : {}}
      />
    </ProtectedRoute>
  );
}
