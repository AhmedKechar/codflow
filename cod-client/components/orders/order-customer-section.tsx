"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Customer } from "@/types";
import { useOrders } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";
import { CustomerSearchSelect } from "./customer-search-select";

interface OrderCustomerSectionProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  customerName: string;
  phone: string;
  customerMode: "existing" | "new";
  onCustomerSelect: (customer: Customer) => void;
  onCustomerClear: () => void;
  onCustomerModeChange: (mode: "existing" | "new") => void;
  onCustomerNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

export function OrderCustomerSection({
  customers,
  selectedCustomer,
  customerName,
  phone,
  customerMode,
  onCustomerSelect,
  onCustomerClear,
  onCustomerModeChange,
  onCustomerNameChange,
  onPhoneChange,
}: OrderCustomerSectionProps) {
  const t = useOrders();
  const { dir } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Customer Search / Mode Toggle */}
      <CustomerSearchSelect
        customers={customers}
        selectedCustomer={selectedCustomer}
        onSelect={onCustomerSelect}
        onClear={onCustomerClear}
        mode={customerMode}
        onModeChange={onCustomerModeChange}
      />

      {/* Manual Input Fields (new mode only) */}
      {customerMode === "new" && (
        <>
          {/* Customer Name */}
          <div className="space-y-2">
            <Label className="text-sm text-foreground font-bold">
              {t.form.customer_name_label}
            </Label>
            <Input
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              placeholder={t.form.customer_name_placeholder}
              className="h-11 bg-muted border-border text-foreground text-base"
              dir={dir}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label className="text-sm text-foreground font-bold">
              {t.form.phone_label}
            </Label>
            <Input
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder={t.form.phone_placeholder}
              className="h-11 bg-muted border-border text-foreground text-base"
              type="tel"
            />
          </div>
        </>
      )}
    </div>
  );
}
