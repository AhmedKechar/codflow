"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Package, Home, Landmark, User, Info, Weight, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OrderCustomerSection } from "./order-customer-section";
import { OrderProductSelector } from "./order-product-selector";
import { OrderNotesSection } from "./order-notes-section";
import { createOrder } from "@/actions/orders";
import { getCommunes } from "@/actions/wilayas";
import { getShippingRulesByProfileId, getShippingRuleCommunes } from "@/actions/shipping-profiles";
import { toast } from "sonner";
import type { Customer, Product, OrderProduct, ShippingRule, Wilaya, Commune, CommuneOverride } from "@/types";
import { useOrders, useCommon } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";
import { createOrderFormSchema, type OrderFormErrors } from "@/validations/orders";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FormSection as Section } from "@/components/ui/form-section";
import { ContextualSaveBar } from "@/components/ui/contextual-save-bar";
import { FormHeader } from "@/components/ui/form-header";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

interface Props {
  customers: Customer[];
  products: Product[];
  shippingRules: ShippingRule[];
  wilayas: Wilaya[];
}

export function OrderFormPage({ customers, products, shippingRules, wilayas }: Props) {
  const router = useRouter();
  const t = useOrders();
  const common = useCommon();
  const { locale, dir } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const isEdit = false;
  const [errors, setErrors] = useState<OrderFormErrors>({});
  const { isDirty, markDirty, resetDirty } = useUnsavedChanges();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilayaId, setWilayaId] = useState<number | null>(null);
  const [wilayaNameAr, setWilayaNameAr] = useState("");
  const [commune, setCommune] = useState("");
  const [pendingCommuneId, setPendingCommuneId] = useState<string | null>(null);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [address, setAddress] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>([]);
  const [notes, setNotes] = useState("");
  const [weight, setWeight] = useState<number | null>(null);
  const [isFragile, setIsFragile] = useState(false);

  // ── Delivery ───────────────────────────────────────────────────────────────
  const [deliveryType, setDeliveryType] = useState<"home" | "stop_desk">("home");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [feeAutoFilled, setFeeAutoFilled] = useState(false);
  const [deliveryModeUnavailable, setDeliveryModeUnavailable] = useState(false);
  const [productShippingRules, setProductShippingRules] = useState<ShippingRule[]>([]);
  const [loadingProductRules, setLoadingProductRules] = useState(false);
  const [communeOverrides, setCommuneOverrides] = useState<CommuneOverride[]>([]);

  // Fetch communes when wilayaId changes
  useEffect(() => {
    if (!wilayaId) {
      setCommunes([]);
      setCommune("");
      setPendingCommuneId(null);
      setCommuneOverrides([]);
      return;
    }
    setLoadingCommunes(true);
    setCommune("");
    getCommunes(wilayaId)
      .then((loaded) => {
        setCommunes(loaded);
        if (pendingCommuneId) {
          const found = loaded.find((c) => c.id === pendingCommuneId);
          if (found) setCommune(found.id);
          setPendingCommuneId(null);
        }
      })
      .catch(() => setCommunes([]))
      .finally(() => setLoadingCommunes(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wilayaId]);

  // Fetch commune overrides when wilayaId changes (for fee calculation)
  useEffect(() => {
    if (!wilayaId) {
      setCommuneOverrides([]);
      return;
    }
    const activeRules = productShippingRules.length > 0 ? productShippingRules : shippingRules;
    const rule = activeRules.find((r) => r.wilayaId === wilayaId);
    if (!rule) {
      setCommuneOverrides([]);
      return;
    }
    getShippingRuleCommunes(rule.profileId, wilayaId)
      .then(setCommuneOverrides)
      .catch(() => setCommuneOverrides([]));
  }, [wilayaId, shippingRules, productShippingRules]);

  // Fetch product-specific shipping rules when products are selected
  useEffect(() => {
    // Find the first product with a shipping profile ID
    const productWithProfile = selectedProducts.find((sp) => {
      const product = products.find((p) => p.id === sp.productId);
      return product?.shippingProfileId;
    });

    if (!productWithProfile) {
      // No product has a specific shipping profile, clear product rules
      setProductShippingRules([]);
      setLoadingProductRules(false);
      return;
    }

    // Get the shipping profile ID from the product
    const product = products.find((p) => p.id === productWithProfile.productId);
    const profileId = product?.shippingProfileId;

    if (!profileId) {
      setProductShippingRules([]);
      setLoadingProductRules(false);
      return;
    }

    // Fetch shipping rules for this profile
    setLoadingProductRules(true);
    getShippingRulesByProfileId(profileId)
      .then(setProductShippingRules)
      .catch(() => setProductShippingRules([]))
      .finally(() => setLoadingProductRules(false));
  }, [selectedProducts, products]);

  // Auto-fill delivery fee when wilayaId, commune, or deliveryType changes
  useEffect(() => {
    if (!wilayaId) {
      setFeeAutoFilled(false);
      setDeliveryModeUnavailable(false);
      return;
    }

    // Prioritize product-specific shipping rules over default
    const activeRules = productShippingRules.length > 0 ? productShippingRules : shippingRules;

    if (activeRules.length === 0) {
      setFeeAutoFilled(false);
      setDeliveryModeUnavailable(false);
      return;
    }

    const rule = activeRules.find((r) => r.wilayaId === wilayaId);
    if (rule) {
      const isHome = deliveryType === "home";

      // Check commune override first (sparse: most communes have no row)
      let effectiveEnabled = isHome ? rule.homeEnabled : rule.stopDeskEnabled;
      let effectiveFee = isHome ? rule.homePrice : rule.stopDeskPrice;

      if (commune) {
        const override = communeOverrides.find((o) => o.communeId === commune);
        if (override) {
          effectiveEnabled = isHome ? override.effectiveHomeEnabled : override.effectiveStopDeskEnabled;
          effectiveFee = isHome ? override.effectiveHomePrice : override.effectiveStopDeskPrice;
        }
      }

      if (!effectiveEnabled) {
        setDeliveryFee(0);
        setFeeAutoFilled(false);
        setDeliveryModeUnavailable(true);
      } else {
        setDeliveryFee(effectiveFee);
        setFeeAutoFilled(true);
        setDeliveryModeUnavailable(false);
      }
    } else {
      setFeeAutoFilled(false);
      setDeliveryModeUnavailable(false);
    }
  }, [wilayaId, commune, deliveryType, shippingRules, productShippingRules, communeOverrides]);

  const productVariants = Object.fromEntries(
    products.map((p) => [p.id, p.variants ?? []])
  );
  const subtotal = selectedProducts.reduce((sum, p) => sum + p.lineTotal, 0);
  const totalPrice = subtotal + deliveryFee;

  function handleCustomerSelect(customer: Customer) {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address ?? "");
    if (customer.communeId) setPendingCommuneId(customer.communeId);
    const matched = wilayas.find(
      (w) => w.nameAr === customer.wilaya || w.name === customer.wilaya
    );
    if (matched) {
      setWilayaId(matched.id);
      setWilayaNameAr(matched.nameAr);
    } else {
      setWilayaId(null);
      setWilayaNameAr(customer.wilaya);
    }
  }

  function handleCustomerClear() {
    setSelectedCustomer(null);
    setCustomerName("");
    setPhone("");
    setWilayaId(null);
    setWilayaNameAr("");
    setCommune("");
    setPendingCommuneId(null);
    setCommunes([]);
    setAddress("");
  }

  function handleSave() {
    const parsed = createOrderFormSchema(locale, deliveryType).safeParse({
      customerName: customerName.trim(),
      phone: phone.trim(),
      wilayaId: wilayaId ?? 0,
      communeId: commune,
      address: address?.trim() || "",
      deliveryFee,
      products: selectedProducts,
    });

    if (!parsed.success) {
      const fieldErrors: OrderFormErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof OrderFormErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      // Also surface the first error as a toast for visibility
      const firstMsg = parsed.error.issues[0]?.message;
      if (firstMsg) toast.error(firstMsg);
      return;
    }

    setErrors({});

    startTransition(async () => {
      try {
        await createOrder({
          customerId: selectedCustomer?.id || crypto.randomUUID(),
          customerName: customerName.trim(),
          phone: phone.trim(),
          wilayaId: wilayaId!,
          communeId: commune,
          address: address?.trim() || undefined,
          price: subtotal,
          notes: notes.trim() || undefined,
          orderType: "online",
          deliveryType,
          deliveryFee,
          weight: weight ?? undefined,
          isFragile: isFragile || undefined,
          products: selectedProducts.map((p) => ({
            productId: p.productId,
            productName: p.productName,
            variantId: p.variantId || undefined,
            variantLabel: p.variantLabel || undefined,
            quantity: p.quantity,
            pricePerUnit: p.pricePerUnit,
            lineTotal: p.lineTotal,
          })),
        });
        toast.success(t.form.success_add);
        resetDirty();
        router.push("/orders");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create order"
        );
      }
    });
  }

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-fade-in">
      <FormHeader backHref="/orders" title={isEdit ? (t.form.title_edit ?? "Edit Order") : (t.form.title_add ?? "New Order")} />
      <ContextualSaveBar
        hasChanges={isDirty}
        isSaving={isPending}
        onSave={handleSave}
        onCancel={() => router.push("/orders")}
        onDiscard={() => router.push("/orders")}
      />

      <div className="flex items-start gap-6">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-6">
          <Section title={t.detail.customer_info} icon={<User size={18} />}>
            <OrderCustomerSection
              customers={customers}
              selectedCustomer={selectedCustomer}
              customerName={customerName}
              phone={phone}
              onCustomerSelect={handleCustomerSelect}
              onCustomerClear={handleCustomerClear}
              customerMode={customerMode}
              onCustomerModeChange={setCustomerMode}
              onCustomerNameChange={(v) => { setCustomerName(v); markDirty(); }}
              onPhoneChange={(v) => { setPhone(v); markDirty(); }}
            />
          </Section>

          <Section title={t.form.products_section} icon={<ShoppingBag size={18} />}>
            <OrderProductSelector
              selectedProducts={selectedProducts}
              onChange={setSelectedProducts}
              availableProducts={products}
              productVariants={productVariants}
            />
          </Section>
        </div>

        {/* Sidebar */}
        <div className="w-[320px] shrink-0 space-y-6">
          <Section title={t.form.delivery_section} icon={<Package size={18} />}>
            <div className="space-y-5">
              {/* Delivery Type */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground ms-1">
                  {t.form.delivery_type_label}
                </Label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeliveryType("home")}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-md border transition-colors",
                      deliveryType === "home"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-muted/20 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Home size={18} />
                    <span className="text-sm font-semibold">{t.form.delivery_type_home}</span>
                  </button>
                  <button
                    onClick={() => setDeliveryType("stop_desk")}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-md border transition-colors",
                      deliveryType === "stop_desk"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-muted/20 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Landmark size={18} />
                    <span className="text-sm font-semibold">{t.form.delivery_type_desk}</span>
                  </button>
                </div>
              </div>

              {/* Wilaya */}
              <div className="space-y-2">
                <Label className="text-sm text-foreground font-bold">
                  {t.form.wilaya_label} *
                </Label>
                <Select
                  value={wilayaId ? String(wilayaId) : ""}
                  onValueChange={(v) => {
                    if (!v) return;
                    const w = wilayas.find((x) => x.id === Number(v));
                    if (w) {
                      setWilayaId(w.id);
                      setWilayaNameAr(w.nameAr);
                      markDirty();
                    }
                  }}
                >
                  <SelectTrigger className="h-11 bg-muted border-border text-foreground">
                    {wilayaNameAr ? (
                      <span className="font-bold">{wilayaNameAr}</span>
                    ) : (
                      <span className="text-muted-foreground">{t.form.wilaya_placeholder}</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {wilayas.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Commune */}
              <div className="space-y-2">
                <Label className="text-sm text-foreground font-bold">
                  {t.form.commune_label} *
                </Label>
                <Select
                  value={commune}
                  onValueChange={(v) => { if (v) { setCommune(v); markDirty(); } }}
                  disabled={!wilayaId || loadingCommunes}
                >
                  <SelectTrigger className="h-11 bg-muted border-border text-foreground">
                    {commune ? (
                      <span className="font-bold">
                        {communes.find((c) => c.id === commune)?.nameAr || commune}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {loadingCommunes
                          ? t.form.commune_loading
                          : t.form.commune_placeholder}
                      </span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {communes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nameAr || c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label className="text-sm text-foreground font-bold">
                  {deliveryType === "home" ? `${t.form.address_label} *` : t.form.address_label}
                </Label>
                <Textarea
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); markDirty(); }}
                  placeholder={t.form.address_placeholder}
                  rows={2}
                  className="bg-muted border-border text-foreground resize-none text-base"
                  dir={dir}
                />
              </div>

              {/* Weight + Fragile */}
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label className="text-sm text-foreground font-bold flex items-center gap-1.5">
                    <Weight size={14} className="text-muted-foreground" />
                    {t.form.weight_label ?? "الوزن (كغ)"}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={weight ?? ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setWeight(isNaN(v) ? null : v);
                      markDirty();
                    }}
                    placeholder="0.5"
                    className="h-11 bg-muted border-border text-foreground text-base"
                  />
                </div>
                <label className="flex items-center gap-2 pb-2 cursor-pointer select-none">
                  <Switch
                    checked={isFragile}
                    onCheckedChange={(v) => { setIsFragile(v); markDirty(); }}
                  />
                  <span className="text-sm font-bold text-foreground flex items-center gap-1">
                    <ShieldAlert size={14} className="text-amber-500" />
                    {t.form.fragile_label ?? "هش"}
                  </span>
                </label>
              </div>

              {/* Delivery Fee */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ms-1">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    {t.form.delivery_fee_label}
                  </Label>
                  {feeAutoFilled && (
                    <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      {productShippingRules.length > 0 ? "Product Rate" : "Matched"}
                    </span>
                  )}
                  {deliveryModeUnavailable && (
                    <span className="text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md">
                      Not configured
                    </span>
                  )}
                  {loadingProductRules && (
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      Loading...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={deliveryFee === 0 ? "" : deliveryFee}
                    onChange={(e) => {
                      setDeliveryFee(Math.max(0, parseFloat(e.target.value) || 0));
                      setFeeAutoFilled(false);
                    }}
                    placeholder="0"
                    className="h-11 bg-card border-border rounded-md pe-16 text-sm font-medium tabular-nums"
                  />
                  <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {common.currency.symbol}
                  </span>
                </div>
              </div>
            </div>
          </Section>

          <Section title={t.detail.notes} icon={<Info size={18} />}>
            <OrderNotesSection notes={notes} onNotesChange={(v) => { setNotes(v); markDirty(); }} />
          </Section>

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                  <span>{t.form.products_section}</span>
                  <span className="tabular-nums font-semibold text-foreground">{formatPrice(subtotal, common.currency.symbol)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                    <span>{t.form.delivery_fee_label}</span>
                    <span className="tabular-nums font-semibold text-foreground">{formatPrice(deliveryFee, common.currency.symbol)}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-muted-foreground">{t.form.order_total}</p>
                    <p className={cn(
                      "text-2xl font-bold tracking-tight tabular-nums",
                      totalPrice > 0 ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {formatPrice(totalPrice, common.currency.symbol)}
                    </p>
                  </div>
                  {selectedProducts.length > 0 && (
                    <div className="bg-muted rounded-md px-3 py-2 flex flex-col items-center min-w-16">
                      <span className="text-lg font-semibold text-foreground tabular-nums leading-tight">{selectedProducts.length}</span>
                      <span className="text-[10px] font-semibold text-muted-foreground">{t.form.items_count}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

