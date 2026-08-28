"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useBilling } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  nameAr?: string;
  priceDzd: number;
  billingCycle: string;
  maxOrders?: number;
  maxProducts?: number;
  maxCustomers?: number;
  maxDrivers?: number;
  maxTeamMembers?: number;
  maxAiCredits?: number;
  isPopular?: boolean;
  features?: string[];
}

interface Props {
  plans: Plan[];
  currentPlanId?: string;
  onSelectPlan: (plan: Plan) => void;
  selectedPlanId?: string;
}

export function PlanComparison({
  plans,
  currentPlanId,
  onSelectPlan,
  selectedPlanId,
}: Props) {
  const t = useBilling();

  return (
    <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId;
        const isSelected = plan.id === selectedPlanId;

        return (
          <Card
            key={plan.id}
            className={cn(
              "relative transition-all duration-200",
              isSelected &&
                "ring-2 ring-primary shadow-lg shadow-primary/10",
              isCurrent &&
                "border-primary/40 bg-primary/5"
            )}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 start-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                  {t.popular}
                </span>
              </div>
            )}

            {isCurrent && (
              <div className="absolute -top-3 end-4">
                <span className="bg-muted text-muted-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  {t.current}
                </span>
              </div>
            )}

            <CardHeader className="pt-6">
              <CardTitle className="text-center">
                {plan.nameAr ?? plan.name}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-center">
                <span className="text-3xl font-black text-foreground">
                  {plan.priceDzd === 0
                    ? t.free
                    : plan.priceDzd.toLocaleString("ar-DZ")}
                </span>
                {plan.priceDzd > 0 && (
                  <span className="text-sm font-bold text-muted-foreground me-1">
                    {t.currency}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {plan.billingCycle === "yearly" ? t.per_year : t.per_month}
                </span>
              </div>

              <div className="space-y-2.5 text-sm">
                <FeatureRow
                  label={t.max_orders}
                  value={
                    plan.maxOrders === -1
                      ? t.unlimited
                      : plan.maxOrders?.toLocaleString("ar-DZ")
                  }
                  included={plan.maxOrders != null && plan.maxOrders > 0}
                />
                <FeatureRow
                  label={t.max_products}
                  value={
                    plan.maxProducts === -1
                      ? t.unlimited
                      : plan.maxProducts?.toLocaleString("ar-DZ")
                  }
                  included={plan.maxProducts != null && plan.maxProducts > 0}
                />
                <FeatureRow
                  label={t.max_customers}
                  value={
                    plan.maxCustomers === -1
                      ? t.unlimited
                      : plan.maxCustomers?.toLocaleString("ar-DZ")
                  }
                  included={plan.maxCustomers != null && plan.maxCustomers > 0}
                />
                <FeatureRow
                  label={t.max_drivers}
                  value={
                    plan.maxDrivers === -1
                      ? t.unlimited
                      : plan.maxDrivers?.toLocaleString("ar-DZ")
                  }
                  included={plan.maxDrivers != null && plan.maxDrivers > 0}
                />
                <FeatureRow
                  label={t.max_team_members}
                  value={
                    plan.maxTeamMembers === -1
                      ? t.unlimited
                      : plan.maxTeamMembers?.toLocaleString("ar-DZ")
                  }
                  included={
                    plan.maxTeamMembers != null && plan.maxTeamMembers > 0
                  }
                />
                <FeatureRow
                  label={t.max_ai_credits}
                  value={
                    plan.maxAiCredits === -1
                      ? t.unlimited
                      : plan.maxAiCredits?.toLocaleString("ar-DZ")
                  }
                  included={plan.maxAiCredits != null && plan.maxAiCredits > 0}
                />
              </div>
            </CardContent>

            <CardFooter>
              <Button
                variant={isCurrent ? "outline" : "default"}
                size="sm"
                className="w-full"
                disabled={isCurrent}
                onClick={() => onSelectPlan(plan)}
              >
                {isCurrent ? t.current : t.select_plan}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

function FeatureRow({
  label,
  value,
  included,
}: {
  label: string;
  value?: string;
  included: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground text-xs">
        {included ? (value ?? "—") : "—"}
      </span>
    </div>
  );
}
