
import { notFound } from "next/navigation";
import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import { DiscountForm } from "@/components/discounts/discount-form";
import { getDiscountCode } from "@/actions/discount-codes";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditDiscountPage({ params }: Props) {
  const { id } = await params;
  const discount = await getDiscountCode(id);

  if (!discount) notFound();

  return (
    <ProtectedRoute requiredScope={SCOPES.DISCOUNTS_MANAGE}>
      <DiscountForm discount={discount} />
    </ProtectedRoute>
  );
}
