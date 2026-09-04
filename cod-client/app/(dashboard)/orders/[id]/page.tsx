
import { notFound } from "next/navigation";
import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { SCOPES } from "../../../../../cod-shared/rbac/scopes";
import { OrderDetailView } from "@/components/orders/order-detail-view";
import { getOrder } from "@/actions/orders";
import { getDrivers, getStoreDriverWilayas } from "@/actions/drivers";
import { getDeliveryCompanies } from "@/actions/delivery-companies";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await getOrder(id).catch(() => null);
  if (!order) notFound();

  const [driversResult, companiesResult, driverWilayasResult] = await Promise.allSettled([
    getDrivers(),
    getDeliveryCompanies(),
    getStoreDriverWilayas(),
  ]);

  return (
    <ProtectedRoute requiredScope={SCOPES.ORDERS_READ}>
      <OrderDetailView
        order={order}
        drivers={driversResult.status === "fulfilled" ? driversResult.value : []}
        companies={companiesResult.status === "fulfilled" ? companiesResult.value : []}
        driverWilayas={driverWilayasResult.status === "fulfilled" ? driverWilayasResult.value : []}
      />
    </ProtectedRoute>
  );
}
