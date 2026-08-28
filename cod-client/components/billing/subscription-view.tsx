"use client";

import { History } from "lucide-react";
import { useBilling } from "@/lib/translations";
import { BillingLayout } from "@/components/billing/billing-layout";
import { SubscriptionStatus } from "@/components/billing/subscription-status";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

interface Props {
  subscription: any;
  history: any[];
  userScopes: string[];
}

export function SubscriptionView({ subscription, history, userScopes }: Props) {
  const t = useBilling();

  return (
    <BillingLayout activeTab="subscription">
      <div className="space-y-5 sm:space-y-6 animate-fade-in">
        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/5 border border-primary/10 rounded-xl w-fit">
          <History className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
          <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-primary/80">
            {t.title}
          </p>
        </div>

        <SubscriptionStatus
          subscription={subscription}
          userScopes={userScopes}
        />

        <Card>
          <CardHeader>
            <CardTitle>{t.payment_history}</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
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
                        {t.plan_name}
                      </th>
                      <th className="text-start py-3 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {t.payment_amount}
                      </th>
                      <th className="text-start py-3 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {t.payment_status}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry: any) => (
                      <tr
                        key={entry.id}
                        className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-foreground">
                          {new Date(entry.createdAt).toLocaleDateString("ar-DZ")}
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium">
                          {entry.planName ?? "—"}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {entry.amountDzd != null
                            ? `${entry.amountDzd.toLocaleString("ar-DZ")} دج`
                            : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge
                            status={entry.status ?? "pending"}
                            label={
                              entry.status === "active"
                                ? t.subscription_active
                                : entry.status === "trialing"
                                  ? t.subscription_trialing
                                  : entry.status
                            }
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
