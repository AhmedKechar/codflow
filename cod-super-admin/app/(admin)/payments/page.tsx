import { listPendingPayments } from "@/actions/payments";
import { PaymentsClient } from "@/components/payments/payments-client";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const payments = await listPendingPayments();
  return <PaymentsClient payments={payments} />;
}
