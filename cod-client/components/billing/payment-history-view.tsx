"use client";

import { Wallet } from "lucide-react";
import { useBilling } from "@/lib/translations";
import { BillingLayout } from "@/components/billing/billing-layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

interface Props {
  payments: any[];
  userScopes: string[];
}

export function PaymentHistoryView({ payments, userScopes }: Props) {
  const t = useBilling();

  return (
    <BillingLayout activeTab="payments">
      <div className="space-y-5 sm:space-y-6 animate-fade-in">
        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/5 border border-primary/10 rounded-xl w-fit">
          <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
          <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-primary/80">
            {t.payment_history}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.payment_history}</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t.no_payments}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-start py-3 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {t.payment_date}
                      </th>
                      <th className="text-start py-3 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {t.payment_amount}
                      </th>
                      <th className="text-start py-3 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {t.payment_method}
                      </th>
                      <th className="text-start py-3 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {t.payment_reference}
                      </th>
                      <th className="text-start py-3 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {t.payment_status}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment: any) => (
                      <tr
                        key={payment.id}
                        className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-foreground">
                          {new Date(payment.createdAt).toLocaleDateString(
                            "ar-DZ"
                          )}
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium">
                          {payment.amountDzd?.toLocaleString("ar-DZ")} دج
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {payment.paymentMethod}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {payment.referenceNumber ?? "—"}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge
                            status={payment.status ?? "pending"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BillingLayout>
  );
}
