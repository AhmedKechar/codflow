"use client";

import { CreditCard, ArrowUpRight, Zap } from "lucide-react";
import { useBilling } from "@/lib/translations";
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
  const isTrial = subscription?.status === "trialing";
  const currentPlan = subscription?.plan;

  return (
    <BillingLayout activeTab="home">
      <div className="space-y-5 sm:space-y-6 animate-fade-in">
        <TrialBanner subscription={subscription} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/5 border border-primary/10 rounded-xl w-fit">
            <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
            <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-primary/80">
              {t.title}
            </p>
          </div>
        </div>

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
