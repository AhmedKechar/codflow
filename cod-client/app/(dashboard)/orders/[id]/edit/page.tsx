import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { SCOPES } from "../../../../../../cod-shared/rbac/scopes";
import { OrderEditForm } from "@/components/orders/order-edit-form";
import { getOrder } from "@/actions/orders";
import { getWilayas, getCommunes } from "@/actions/wilayas";

export default async function OrderEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await getOrder(id).catch(() => null);
  if (!order) notFound();

  const [wilayasResult, communesResult] = await Promise.allSettled([
    getWilayas(),
    order.wilayaId ? getCommunes(order.wilayaId) : Promise.resolve([]),
  ]);

  const wilayas = wilayasResult.status === "fulfilled" ? wilayasResult.value : [];
  const communes = communesResult.status === "fulfilled" ? communesResult.value : [];

  return (
    <ProtectedRoute requiredScope={SCOPES.ORDERS_UPDATE}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/orders/${id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="w-4 h-4 me-1" />
            العودة للطلب
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold">تعديل الطلب {order.orderNumber}</h1>
          <p className="text-muted-foreground mt-1">
            تعديل بيانات الطلب والعميل والتسعير
          </p>
        </div>

        <OrderEditForm order={order} wilayas={wilayas} communes={communes} />
      </div>
    </ProtectedRoute>
  );
}
