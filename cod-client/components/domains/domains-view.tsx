"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe, Plus, RefreshCw } from "lucide-react";
import { useDomains } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { DomainList } from "@/components/domains/domain-list";
import { DomainForm } from "@/components/domains/domain-form";
import { getCustomDomains, type CustomDomain } from "@/actions/custom-domains";

export function DomainsView() {
  const t = useDomains();
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getCustomDomains();
      setDomains(result.rows);
    } catch (error) {
      console.error("Failed to fetch custom domains:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t.page_title ?? "Custom Domains"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.page_subtitle ?? "Manage your store's custom domains"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw
              size={16}
              className={isLoading ? "animate-spin" : ""}
            />
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} className="mr-2" />
            {t.actions?.add ?? "Add Domain"}
          </Button>
        </div>
      </div>

      {showForm && (
        <DomainForm
          onSuccess={() => {
            setShowForm(false);
            fetchData();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <DomainList
        domains={domains}
        isLoading={isLoading}
        onRefresh={fetchData}
      />
    </div>
  );
}
