"use client";

import { CreditCard, ArrowUpRight, Zap } from "lucide-react";
import { useBilling, useNavigation } from "@/lib/translations";
import { PageHeader } from "@/components/ui/page-header";
import { BillingLayout } from "@/components/billing/billing-layout";
import { CurrentPlanCard } from "@/components/billing/current-plan-card";
import { UsageMeter } from "@/components/billing/usage-meter";
import { TrialBanner } from "@/components/billing/trial-banner";

interface Props {
  subscription: any;
  plans: any[];
  aiCredits: any;
  userScopes: string[];
}

export function BillingView({
  subscription,
  plans,
  aiCredits,
  userScopes,
}: Props) {
  const t = useBilling();
  const nav = useNavigation();
  const isTrial = subscription?.status === "trialing";
  const currentPlan = subscription?.plan;

  return (
    <BillingLayout activeTab="home">
      <div className="space-y-5 sm:space-y-6 animate-fade-in">
        <TrialBanner subscription={subscription} />

        <PageHeader title={nav.sidebar.billing} />

        <div className="grid gap-5 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <CurrentPlanCard
            subscription={subscription}
            userScopes={userScopes}
          />

          <div className="space-y-5 sm:space-y-6">
            {currentPlan?.maxOrders != null && (
              <UsageMeter
                label={t.max_orders}
                used={subscription?.ordersUsed ?? 0}
                total={currentPlan.maxOrders}
              />
            )}
            {currentPlan?.maxProducts != null && (
              <UsageMeter
                label={t.max_products}
                used={subscription?.productsUsed ?? 0}
                total={currentPlan.maxProducts}
              />
            )}
            {aiCredits && (
              <UsageMeter
                label={t.ai_credits}
                used={aiCredits.used ?? 0}
                total={aiCredits.total ?? 0}
              />
            )}
          </div>
        </div>
      </div>
    </BillingLayout>
  );
}
