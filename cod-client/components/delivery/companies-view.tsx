"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Zap, Package, TrendingUp, ArrowRight } from "lucide-react";
import { ProtectedAction } from "@/components/rbac/ProtectedAction";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import { PROVIDER_CONFIGS } from "@/lib/delivery/providers";
import { useDelivery, useNavigation } from "@/lib/translations";
import { PageHeader } from "@/components/ui/page-header";
import { useLanguage } from "@/lib/i18n-context";
import type { DeliveryCompany } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  companies: DeliveryCompany[];
  userScopes: string[];
}

export function CompaniesView({ companies, userScopes }: Props) {
  const t = useDelivery();
  const nav = useNavigation();
  const router = useRouter();
  const { dir } = useLanguage();

  const connectedCount = companies.filter((c) => c.isConnected).length;
  const providers = Object.values(PROVIDER_CONFIGS);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page header */}
      <PageHeader title={nav.sidebar.delivery_companies} />

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {providers.map((provider, i) => {
          const company = companies.find((c) => c.code === provider.code);
          const isConnected = company?.isConnected ?? false;
          const hasWebhook = provider.code === "zr_express"
            ? !!company?.webhookEndpointId
            : provider.code === "yalidine"
              ? !!company?.webhookSecret
              : false;

          return (
            <div
              key={provider.code}
              onClick={() => router.push(`/delivery/companies/${provider.code}`)}
              className={cn(
                "group bg-card rounded-lg border-border overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] animate-fade-in-up",
                isConnected && "border-primary/10"
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Connected accent */}
              {isConnected && (
                <div className="h-[3px] bg-border" />
              )}

              <div className="p-5">
                {/* Top row: logo + status + arrow */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 text-lg font-semibold transition-transform duration-300 group-hover:scale-105",
                      isConnected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground/30"
                    )}>
                      {provider.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground tracking-tight">{provider.name}</p>
                      <div className={cn(
                        "inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border mt-1",
                        isConnected
                          ? "bg-success/10 text-success border-success/30"
                          : "bg-muted/30 text-muted-foreground/40 border-border"
                      )}>
                        {isConnected ? <CheckCircle2 size={8} /> : <Circle size={8} />}
                        {isConnected ? t.providers?.connected ?? "Connected" : t.providers?.not_connected ?? "Not connected"}
                      </div>
                    </div>
                  </div>

                  <ArrowRight
                    size={16}
                    className={cn(
                      "shrink-0 mt-1 transition-all duration-300 opacity-0 group-hover:opacity-100",
                      dir === "rtl" ? "rotate-180 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5",
                      "text-primary/50"
                    )}
                  />
                </div>

                {/* Capabilities */}
                <div className="flex flex-wrap gap-1.5">
                  {provider.supportsHomeDelivery && (
                    <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg bg-muted/30 text-muted-foreground/50">
                      <Zap size={8} />{t.delivery_type?.home ?? "Home"}
                    </span>
                  )}
                  {provider.supportsStopDesk && (
                    <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg bg-muted/30 text-muted-foreground/50">
                      <Package size={8} />{t.delivery_type?.stop_desk ?? "Desk"}
                    </span>
                  )}
                  {provider.supportsTracking && (
                    <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg bg-muted/30 text-muted-foreground/50">
                      <TrendingUp size={8} />{t.companies?.tracking ?? "Tracking"}
                    </span>
                  )}
                  {hasWebhook && (
                    <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg bg-success/10 text-success border border-success/30">
                      <Zap size={8} />{t.companies?.webhook ?? "Webhook"}
                    </span>
                  )}
                </div>

                {/* Not connected CTA */}
                {!isConnected && (
                  <ProtectedAction userScopes={userScopes} requiredScope={SCOPES.DELIVERY_MANAGE}>
                    <div className="mt-4 pt-3 border-t border-border/40">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/50 group-hover:text-primary transition-colors">
                        {t.companies?.tap_to_connect ?? "Tap to connect"}
                      </p>
                    </div>
                  </ProtectedAction>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
