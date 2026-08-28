"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useBilling } from "@/lib/translations";

interface Props {
  subscription: any;
  userScopes: string[];
}

export function SubscriptionStatus({ subscription, userScopes }: Props) {
  const t = useBilling();
  const router = useRouter();

  const status = subscription?.status ?? "expired";
  const plan = subscription?.plan;
  const startsAt = subscription?.startsAt;
  const endsAt = subscription?.endsAt;

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
          <CardTitle>{t.subscription_active}</CardTitle>
          <StatusBadge status={status} label={statusLabel} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t.plan_name}
            </p>
            <p className="text-sm font-bold text-foreground">
              {plan?.nameAr ?? plan?.name ?? "—"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t.plan_price}
            </p>
            <p className="text-sm font-bold text-foreground">
              {plan?.priceDzd != null
                ? `${plan.priceDzd.toLocaleString("ar-DZ")} ${t.currency}`
                : "—"}
            </p>
          </div>

          {startsAt && (
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {t.billing_cycle}
              </p>
              <p className="text-sm font-bold text-foreground">
                {new Date(startsAt).toLocaleDateString("ar-DZ")}
              </p>
            </div>
          )}

          {endsAt && (
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {t.trial_ends}
              </p>
              <p className="text-sm font-bold text-foreground">
                {new Date(endsAt).toLocaleDateString("ar-DZ")}
              </p>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => router.push("/billing/upgrade")}
        >
          <ArrowUpRight className="w-4 h-4 me-1.5" />
          {t.upgrade_now}
        </Button>
      </CardContent>
    </Card>
  );
}
