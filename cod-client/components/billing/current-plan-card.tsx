"use client";

import { useRouter } from "next/navigation";
import { CreditCard, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useBilling, useCommon } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";

interface Props {
  subscription: any;
  userScopes: string[];
}

export function CurrentPlanCard({ subscription, userScopes }: Props) {
  const t = useBilling();
  const common = useCommon();
  const { locale } = useLanguage();
  const router = useRouter();

  const plan = subscription?.plan;
  const status = subscription?.status ?? "expired";
  const endsAt = subscription?.endsAt;

  const daysRemaining = endsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : null;

  const statusLabel =
    status === "active"
      ? t.subscription_active
      : status === "trialing"
        ? t.subscription_trialing
        : status === "past_due"
          ? t.subscription_past_due
          : status === "cancelled"
            ? t.subscription_cancelled
            : t.subscription_expired;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t.current_plan}</CardTitle>
          <StatusBadge status={status} label={statusLabel} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-foreground">
            {plan?.nameAr ?? plan?.name ?? "—"}
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-primary">
            {plan?.priceDzd != null ? plan.priceDzd.toLocaleString("ar-DZ") : "—"}
          </span>
          <span className="text-sm font-bold text-muted-foreground">
            {t.currency}
            {plan?.billingCycle === "yearly" ? t.per_year : t.per_month}
          </span>
        </div>

        {daysRemaining != null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-bold">{t.days_remaining}:</span>
            <span className="font-black text-foreground">{daysRemaining}</span>
          </div>
        )}

        {plan?.maxOrders != null && (
          <div className="text-xs text-muted-foreground">
            <span className="font-bold">{t.max_orders}:</span>{" "}
            <span className="font-black text-foreground">
              {plan.maxOrders === -1 ? t.unlimited : plan.maxOrders}
            </span>
          </div>
        )}

        {plan?.maxProducts != null && (
          <div className="text-xs text-muted-foreground">
            <span className="font-bold">{t.max_products}:</span>{" "}
            <span className="font-black text-foreground">
              {plan.maxProducts === -1 ? t.unlimited : plan.maxProducts}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => router.push("/billing/upgrade")}
        >
          <ArrowUpRight className="w-4 h-4 me-1.5" />
          {t.upgrade_now}
        </Button>
      </CardFooter>
    </Card>
  );
}
