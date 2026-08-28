"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useBilling } from "@/lib/translations";
import { BillingLayout } from "@/components/billing/billing-layout";
import { PlanComparison } from "@/components/billing/plan-comparison";
import { PaymentForm } from "@/components/billing/payment-form";

interface Props {
  subscription: any;
  plans: any[];
  userScopes: string[];
}

export function UpgradeView({ subscription, plans, userScopes }: Props) {
  const t = useBilling();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  return (
    <BillingLayout activeTab="upgrade">
      <div className="space-y-5 sm:space-y-6 animate-fade-in">
        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/5 border border-primary/10 rounded-xl w-fit">
          <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
          <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-primary/80">
            {t.upgrade_plan}
          </p>
        </div>

        <PlanComparison
          plans={plans}
          currentPlanId={subscription?.planId}
          onSelectPlan={setSelectedPlan}
          selectedPlanId={selectedPlan?.id}
        />

        {selectedPlan && (
          <PaymentForm
            plan={selectedPlan}
            subscription={subscription}
            userScopes={userScopes}
          />
        )}
      </div>
    </BillingLayout>
  );
}
