"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Customer, Wilaya, Commune } from "@/types";
import { useOrders } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";
import { CustomerSearchSelect } from "./customer-search-select";

interface OrderCustomerSectionProps {
  customers: Customer[];
  wilayas: Wilaya[];
  selectedCustomer: Customer | null;
  customerName: string;
  phone: string;
  wilayaId: number | null;
  wilayaNameAr: string;
  commune: string;
  communes: Commune[];
  loadingCommunes: boolean;
  address: string;
  deliveryType: "home" | "stop_desk";
  customerMode: "existing" | "new";
  onCustomerSelect: (customer: Customer) => void;
  onCustomerClear: () => void;
  onCustomerModeChange: (mode: "existing" | "new") => void;
  onCustomerNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onWilayaChange: (wilayaId: number, nameAr: string) => void;
  onCommuneChange: (name: string) => void;
  onAddressChange: (value: string) => void;
}

export function OrderCustomerSection({
  customers,
  wilayas,
  selectedCustomer,
  customerName,
  phone,
  wilayaId,
  wilayaNameAr,
  commune,
  communes,
  loadingCommunes,
  address,
  deliveryType,
  customerMode,
  onCustomerSelect,
  onCustomerClear,
  onCustomerModeChange,
  onCustomerNameChange,
  onPhoneChange,
  onWilayaChange,
  onCommuneChange,
  onAddressChange,
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

      {/* Manual Input Fields (new mode or when customer is selected but fields are editable) */}
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

      {/* Existing Customer Info (read-only when customer is selected) */}
      {customerMode === "existing" && selectedCustomer && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground font-bold">{t.form.customer_name_label}</Label>
              <div className="h-11 flex items-center px-4 rounded-lg bg-muted/50 border border-border/50">
                <span className="text-sm font-bold text-foreground">{selectedCustomer.name}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground font-bold">{t.form.phone_label}</Label>
              <div className="h-11 flex items-center px-4 rounded-lg bg-muted/50 border border-border/50">
                <span className="text-sm font-bold text-foreground" dir="ltr">{selectedCustomer.phone}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Address — always shown (for both modes) */}
      <div className="space-y-2">
        <Label className="text-sm text-foreground font-bold">
          {deliveryType === "home" ? `${t.form.address_label} *` : t.form.address_label}
        </Label>
        <Textarea
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={t.form.address_placeholder}
          rows={2}
          className="bg-muted border-border text-foreground resize-none text-base"
          dir={dir}
        />
      </div>
    </div>
  );
}
