"use client";

import { useRouter, usePathname } from "next/navigation";
import { CreditCard, History, ArrowUpRight, Wallet } from "lucide-react";
import { useBilling } from "@/lib/translations";
import { cn } from "@/lib/utils";

type TabId = "home" | "subscription" | "upgrade" | "payments";

interface Tab {
  id: TabId;
  labelKey: string;
  href: string;
  icon: React.ElementType;
}

const TABS: Tab[] = [
  { id: "home", labelKey: "home", href: "/billing", icon: CreditCard },
  {
    id: "subscription",
    labelKey: "subscription",
    href: "/billing/subscription",
    icon: History,
  },
  {
    id: "upgrade",
    labelKey: "upgrade",
    href: "/billing/upgrade",
    icon: ArrowUpRight,
  },
  {
    id: "payments",
    labelKey: "payments",
    href: "/billing/payment-history",
    icon: Wallet,
  },
];

const TAB_LABELS: Record<string, Record<TabId, string>> = {
  ar: {
    home: "الرئيسية",
    subscription: "الاشتراك",
    upgrade: "ترقية الباقة",
    payments: "سجل المدفوعات",
  },
  en: {
    home: "Overview",
    subscription: "Subscription",
    upgrade: "Upgrade",
    payments: "Payments",
  },
  fr: {
    home: "Aperçu",
    subscription: "Abonnement",
    upgrade: "Mise à niveau",
    payments: "Paiements",
  },
};

interface Props {
  activeTab: TabId;
  children: React.ReactNode;
}

export function BillingLayout({ activeTab, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useBilling() as any;

  const labels = TAB_LABELS[locale] ?? TAB_LABELS.en;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex overflow-x-auto gap-1 p-1 bg-muted/30 rounded-xl border border-border/40">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.href)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {labels[tab.id]}
            </button>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}
