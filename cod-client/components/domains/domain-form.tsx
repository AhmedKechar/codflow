"use client";

import { useState } from "react";
import { Globe, Loader2 } from "lucide-react";
import { useDomains } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addCustomDomain } from "@/actions/custom-domains";
import { toast } from "sonner";

interface DomainFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DomainForm({ onSuccess, onCancel }: DomainFormProps) {
  const t = useDomains();
  const [domain, setDomain] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const result = await addCustomDomain({ domain: domain.trim() });

      if (result.success) {
        toast.success(t.toast?.created ?? "Domain added successfully");
        setDomain("");
        onSuccess?.();
      } else {
        toast.error(
          result.error || (t.toast?.error ?? "Failed to add domain"),
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-border/60 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Globe size={20} className="text-primary" />
          {t.form?.add_domain ?? "Add Custom Domain"}
        </h3>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {t.form?.domain ?? "Domain Name"} *
          </label>
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="shop.example.com"
            required
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            {t.form?.domain_hint ??
              "Enter the domain you want to connect to your store."}
          </p>
        </div>

        <div className="bg-muted/30 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">
            {t.form?.dns_instructions ?? "DNS Setup Instructions"}
          </h4>
          <p className="text-xs text-muted-foreground mb-2">
            {t.form?.dns_description ??
              "Add the following DNS record to your domain provider:"}
          </p>
          <div className="bg-background rounded-lg p-3 font-mono text-xs space-y-1">
            <div className="flex gap-2">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-semibold">CNAME</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-semibold">
                {domain || "shop"}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">Value:</span>
              <span className="font-semibold">proxy.codflow.dz</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            {t.form?.cancel ?? "Cancel"}
          </Button>
        )}
        <Button type="submit" disabled={isSaving || !domain.trim()}>
          {isSaving && <Loader2 size={16} className="mr-2 animate-spin" />}
          {t.form?.add ?? "Add Domain"}
        </Button>
      </div>
    </form>
  );
}
