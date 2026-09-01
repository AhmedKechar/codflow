"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useDiscounts, useNavigation } from "@/lib/translations";
import { DiscountList } from "./discount-list";
import { PageHeader } from "@/components/ui/page-header";
import type { DiscountCode } from "@/actions/discount-codes";

interface Props {
  discounts: DiscountCode[];
  userScopes: string[];
}

export function DiscountsView({ discounts, userScopes }: Props) {
  const t = useDiscounts();
  const nav = useNavigation();
  const router = useRouter();

  function handleCreate() {
    router.push("/discounts/new");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={nav.sidebar.discounts}
        primaryAction={{
          label: t.add_code,
          onClick: handleCreate,
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <DiscountList
        discounts={discounts}
        userScopes={userScopes}
      />
    </div>
  );
}
