"use client";

import { useRouter } from "next/navigation";
import { Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtectedAction } from "@/components/rbac/ProtectedAction";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import { useDiscounts } from "@/lib/translations";
import { DiscountList } from "./discount-list";
import type { DiscountCode } from "@/actions/discount-codes";

interface Props {
  discounts: DiscountCode[];
  userScopes: string[];
}

export function DiscountsView({ discounts, userScopes }: Props) {
  const t = useDiscounts();
  const router = useRouter();

  function handleCreate() {
    router.push("/discounts/new");
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {discounts.length} {t.codes_count}
          </p>
        </div>
        <ProtectedAction requiredScope={SCOPES.DISCOUNTS_MANAGE} userScopes={userScopes}>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            {t.add_code}
          </Button>
        </ProtectedAction>
      </div>

      <DiscountList
        discounts={discounts}
        userScopes={userScopes}
      />
    </div>
  );
}
