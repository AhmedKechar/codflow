"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Eye, Package, MapPin, MoreHorizontal, Truck, Building2,
  Check, Search, X, Star, Zap, Trash2, Filter,
  Home, Store,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable, TableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorModal } from "@/components/errors/error-modal";
import { useErrorLocale } from "@/lib/errors/use-locale";
import { useOrders, useCommon } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";
import { formatPrice, formatDate, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { updateOrderStatus, assignDriverToOrder, dispatchOrder, deleteOrder } from "@/actions/orders";
import { fetchCompanyStopDesks } from "@/actions/delivery-companies";
import { useConfirm } from "@/components/ui/use-confirm";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox } from "@/components/ui/checkbox";
import { FilterChip } from "@/components/ui/filter-chip";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { BulkDispatchDialog } from "./bulk-dispatch-dialog";
import type { Order, OrderStatus, Driver, DeliveryCompany, StopDesk } from "@/types";
import { SCOPES } from "@/../cod-shared/rbac/scopes";

// Statuses the user can manually set via the inline row dropdown.
// "dispatched" is intentionally excluded — it is set by the dispatch action only.
const ALL_STATUSES: OrderStatus[] = [
  "new", "confirmed", "unreachable", "busy", "postponed",
  "shipped", "delivered", "returned", "cancelled", "fake", "duplicate",
];

// Statuses available in the filter dropdown — includes "dispatched" so users
// can filter the list to the carrier-validation queue.
const FILTER_STATUSES: OrderStatus[] = [
  "new", "confirmed", "unreachable", "busy", "postponed",
  "shipped", "delivered", "returned", "cancelled", "fake", "duplicate",
];

// Provider capability matrix for the dispatch dialog's optional fields.
// Mirrors what each provider's createShipment adapter actually consumes.
function dispatchFieldSupport(companyCode: string) {
  const isEcotrack = companyCode === "ecotrack" || companyCode.endsWith("_ecotrack");
  if (isEcotrack)               return { remarks: true,  weight: true,  fragile: true  };
  if (companyCode === "noest")  return { remarks: true,  weight: true,  fragile: false };
  // yalidine and zr_express: createShipment payload has no remarks/weight/fragile fields,
  // so showing those inputs in the UI would mislead the user — they would be discarded.
  return { remarks: false, weight: false, fragile: false };
}

// ── Inline status dropdown ─────────────────────────────────────────────────

function StatusCell({ order, onRefresh }: { order: Order; onRefresh: () => void }) {
  const t = useOrders();
  const [isPending, startTransition] = useTransition();

  function changeStatus(status: OrderStatus) {
    if (status === order.status) return;
    startTransition(async () => {
      const res = await updateOrderStatus(order.id, status);
      if (!res.ok) {
        toast.error(res.error || (t.detail?.error_status ?? "Failed to update status"));
        return;
      }
      toast.success((t.detail?.status_updated ?? "Status: ") + (t.status?.[status] ?? status));
      onRefresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            disabled={isPending}
            className="cursor-pointer hover:opacity-75 transition-opacity focus:outline-none"
          />
        }
      >
        <span className="inline-flex items-center gap-1.5">
          <StatusBadge
            status={order.status}
            label={order.status === "shipped" && order.deliveryMethodName
              ? `${t.status?.shipped ?? "شُحن"} · ${order.deliveryMethodName}`
              : undefined}
          />
          {order.lastUpdatedBy?.startsWith("webhook:") && (
            <span
              title={`Auto-updated by ${order.lastUpdatedBy === "webhook:zr_express" ? "ZR Express" : "Yalidine"}`}
              className="text-primary"
            >
              <Zap size={11} />
            </span>
          )}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {ALL_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => changeStatus(s)}
            className={cn("gap-2", s === order.status && "font-black")}
          >
            <StatusBadge status={s} />
            {s === order.status && <Check size={11} className="ms-auto text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Unified Delivery Dialog ────────────────────────────────────────────────

export function DeliveryDialog({
  order,
  drivers,
  companies,
  driverWilayas,
  onClose,
  onAssigned,
  onDispatched,
}: {
  order: Order;
  drivers: Driver[];
  companies: DeliveryCompany[];
  driverWilayas: number[];
  onClose: () => void;
  onAssigned: () => void;
  onDispatched: (trackingNumber: string, labelUrl?: string | null) => void;
}) {
  const t = useOrders();
  const locale = useErrorLocale();

  const hasDriverOption = order.wilayaId != null && driverWilayas.includes(order.wilayaId);
  const hasCompanyOption = companies.length > 0;

  // Pick default mode: driver if available, else company
  const [mode, setMode] = useState<"driver" | "company">(hasDriverOption ? "driver" : "company");

  // ── Driver state ──────────────────────────────────────────────────────
  const [driverQuery, setDriverQuery] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState(order.driverId ?? "");
  const [assigning, startAssignTransition] = useTransition();
  const [errorState, setErrorState] = useState<{ isOpen: boolean; message: string; code?: string }>({ isOpen: false, message: "" });

  const filteredDrivers = drivers.filter((d) => {
    const name = `${d.firstName} ${d.lastName}`.toLowerCase();
    return name.includes(driverQuery.toLowerCase());
  });

  function handleAssign() {
    if (!selectedDriverId) return;
    startAssignTransition(async () => {
      try {
        await assignDriverToOrder(order.id, selectedDriverId);
        toast.success(t.assign_driver_dialog?.success ?? "تم تعيين السائق");
        onAssigned();
        onClose();
      } catch (err) {
        setErrorState({ isOpen: true, message: err instanceof Error ? err.message : (t.detail?.error_assign ?? "فشل في تعيين السائق") });
      }
    });
  }

  // ── Company state ─────────────────────────────────────────────────────
  const [selectedCompanyId, setSelectedCompanyId] = useState(order.companyId ?? "");
  const [stationCode, setStationCode] = useState("");
  const [stationQuery, setStationQuery] = useState("");
  const [stations, setStations] = useState<StopDesk[]>([]);
  const [loadingStations, startStationsTransition] = useTransition();
  const [remarks, setRemarks] = useState("");
  const [weight, setWeight] = useState("");
  const [fragile, setFragile] = useState(false);
  const [dispatching, startDispatchTransition] = useTransition();

  const isStopDesk = order.deliveryType === "stop_desk";
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const fieldSupport = dispatchFieldSupport(selectedCompany?.code ?? "");

  useEffect(() => {
    if (!selectedCompanyId || !isStopDesk) return;
    setStations([]);
    setStationCode("");
    setStationQuery("");
    startStationsTransition(async () => {
      try {
        const desks = await fetchCompanyStopDesks(selectedCompanyId, { activeOnly: true });
        setStations(desks);
      } catch {
        setStations([]);
      }
    });
  }, [selectedCompanyId, isStopDesk]);

  const wilayaDesks = useMemo(
    () => (order.wilayaId ? stations.filter((s) => s.wilayaId === order.wilayaId) : []),
    [stations, order.wilayaId]
  );
  const defaultPool = wilayaDesks.length > 0 ? wilayaDesks : stations;

  const filteredStations = useMemo(() => {
    if (!stationQuery.trim()) return defaultPool;
    const q = stationQuery.toLowerCase();
    return stations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.commune ?? "").toLowerCase().includes(q)
    );
  }, [stations, defaultPool, stationQuery]);

  function handleDispatch() {
    if (!selectedCompanyId) return;
    startDispatchTransition(async () => {
      try {
        const parsedWeight = parseFloat(weight);
        const result = await dispatchOrder(order.id, {
          companyId: selectedCompanyId,
          stationCode: stationCode || undefined,
          remarks: fieldSupport.remarks ? (remarks || undefined) : undefined,
          weight: fieldSupport.weight && weight && !isNaN(parsedWeight) && parsedWeight > 0 ? parsedWeight : undefined,
          fragile: fieldSupport.fragile && fragile ? true : undefined,
        });
        toast.success((t.dispatch_dialog?.success ?? "تم الإرسال — التتبع: ") + result.trackingNumber);
        onDispatched(result.trackingNumber, result.labelUrl);
        onClose();
      } catch (err) {
        setErrorState({ isOpen: true, message: err instanceof Error ? err.message : (t.detail?.dispatch_failed ?? "فشل الإرسال") });
      }
    });
  }

  const remarksMax = 500;
  const remarksOver = remarks.length > remarksMax;

  // ── Determine available modes ─────────────────────────────────────────
  const modes: Array<{ key: "driver" | "company"; label: string; icon: React.ReactNode }> = [];
  if (hasDriverOption) {
    modes.push({ key: "driver", label: t.assign_driver_dialog?.title ?? "تعيين سائق", icon: <Truck size={14} /> });
  }
  if (hasCompanyOption) {
    modes.push({ key: "company", label: t.dispatch_dialog?.title ?? "إرسال لشركة", icon: <Building2 size={14} /> });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-black">
            {modes.length === 1 ? modes[0].label : "التوصيل"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-semibold">
            {order.orderNumber} · {order.wilaya}
          </p>
        </DialogHeader>

        {/* ── Mode selector tabs ─────────────────────────────────────────── */}
        {modes.length > 1 && (
          <div className="flex gap-1 p-1 rounded-xl bg-muted/40">
            {modes.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors",
                  mode === m.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Driver mode ────────────────────────────────────────────────── */}
        {mode === "driver" && hasDriverOption && (
          <>
            <div className="relative">
              <Search size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={driverQuery}
                onChange={(e) => setDriverQuery(e.target.value)}
                placeholder={t.assign_driver_dialog?.search_placeholder ?? "بحث عن سائق..."}
                className="ps-8 h-9 text-sm"
              />
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto">
              {filteredDrivers.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground font-semibold">
                  {t.assign_driver_dialog?.no_drivers ?? "لا يوجد سائقون"}
                </p>
              )}
              {filteredDrivers.map((d) => {
                const isSelected = selectedDriverId === d.id;
                const isCurrent = order.driverId === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDriverId(d.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start transition-colors",
                      isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/60 border border-transparent"
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black shrink-0">
                      {d.firstName.charAt(0)}{d.lastName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{d.firstName} {d.lastName}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                        {d.status === "available" ? (t.assign_driver_dialog?.available ?? "متاح") : (t.assign_driver_dialog?.busy ?? "مشغول")}
                        {isCurrent && " · الحالي"}
                      </p>
                    </div>
                    {isSelected && <Check size={14} className="text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>

            <Button onClick={handleAssign} disabled={!selectedDriverId || assigning} className="w-full h-10 font-black">
              {assigning ? (t.assign_driver_dialog?.assigning ?? "جاري التعيين...") : (t.assign_driver_dialog?.assign ?? "تعيين")}
            </Button>
          </>
        )}

        {/* ── Company mode ───────────────────────────────────────────────── */}
        {mode === "company" && hasCompanyOption && (
          <>
            <div className="space-y-2">
              {companies.map((c) => {
                const isSelected = selectedCompanyId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCompanyId(c.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-start transition-colors border",
                      isSelected ? "bg-primary/10 border-primary/30" : "hover:bg-muted/60 border-border/50"
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{c.code}</p>
                    </div>
                    {isSelected && <Check size={14} className="text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Stop-desk picker */}
            {isStopDesk && selectedCompanyId && (
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">
                  {t.dispatch_dialog?.station_code_label ?? "المحطة"}
                </label>

                {loadingStations ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/30 bg-muted/20">
                    <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                    <span className="text-xs text-muted-foreground font-semibold">
                      {t.dispatch_dialog?.loading_stations ?? "جاري تحميل المحطات..."}
                    </span>
                  </div>
                ) : stations.length > 0 ? (
                  <>
                    <div className="relative">
                      <Search size={12} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                      <Input
                        value={stationQuery}
                        onChange={(e) => setStationQuery(e.target.value)}
                        placeholder={t.dispatch_dialog?.station_picker_placeholder ?? "بحث في المحطات..."}
                        className="ps-8 h-9 text-sm"
                      />
                    </div>
                    {!stationQuery && wilayaDesks.length > 0 && wilayaDesks.length < stations.length && (
                      <p className="text-[10px] text-muted-foreground/50 font-semibold">
                        {order.wilaya} · ابحث لرؤية جميع الولايات
                      </p>
                    )}
                    <div className="max-h-44 overflow-y-auto space-y-1 rounded-xl border border-border/30 p-1.5">
                      {filteredStations.length === 0 ? (
                        <p className="py-3 text-center text-xs text-muted-foreground font-semibold">—</p>
                      ) : (
                        filteredStations.map((s) => {
                          const isSelected = stationCode === s.code;
                          return (
                            <button
                              key={s.code}
                              onClick={() => setStationCode(s.code)}
                              className={cn(
                                "w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-start transition-colors",
                                isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/60 border border-transparent"
                              )}
                            >
                              <span className="shrink-0 font-mono text-[10px] font-black text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded mt-0.5">
                                {s.code}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">{s.name}</p>
                                {s.commune && (
                                  <p className="text-[10px] text-muted-foreground/60 font-semibold truncate">
                                    {s.commune}
                                  </p>
                                )}
                              </div>
                              {isSelected && <Check size={12} className="text-primary shrink-0 mt-1" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                    {stationCode && (
                      <p className="text-[10px] text-primary/70 font-black uppercase tracking-wide">
                        ✓ {stationCode}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <Input
                      value={stationCode}
                      onChange={(e) => setStationCode(e.target.value)}
                      placeholder={t.dispatch_dialog?.station_code_placeholder ?? "مثال: 16A"}
                      className="h-9 text-sm font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      {t.dispatch_dialog?.station_code_hint ?? "مطلوب لطلبات الاستوديو"}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Remarks */}
            {fieldSupport.remarks && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">
                    {t.dispatch_dialog?.remarks_label ?? "ملاحظات (اختياري)"}
                  </label>
                  {remarks.length > 0 && (
                    <span className={cn("text-[10px] font-bold tabular-nums", remarksOver ? "text-rose-500" : "text-muted-foreground/50")}>
                      {remarks.length}/{remarksMax}
                    </span>
                  )}
                </div>
                <Input
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={t.dispatch_dialog?.remarks_placeholder ?? "مثال: اتصل قبل التوصيل"}
                  className={cn("h-9 text-sm", remarksOver && "border-rose-400 focus-visible:ring-rose-400")}
                />
              </div>
            )}

            {/* Weight + Fragile */}
            {(fieldSupport.weight || fieldSupport.fragile) && (
              <div className="flex items-end gap-3">
                {fieldSupport.weight && (
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">
                      {t.detail?.weight ?? "الوزن (كغ)"}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="0.5"
                      className="h-9 text-sm"
                    />
                  </div>
                )}
                {fieldSupport.fragile && (
                  <label className="flex items-center gap-2 pb-2 cursor-pointer select-none">
                    <Checkbox checked={fragile} onCheckedChange={(v) => setFragile(!!v)} />
                    <span className="text-sm font-bold">{t.detail?.fragile ?? "هش"}</span>
                  </label>
                )}
              </div>
            )}

            <Button
              onClick={handleDispatch}
              disabled={!selectedCompanyId || dispatching || remarksOver || (isStopDesk && !stationCode)}
              className="w-full h-10 font-black"
            >
              {dispatching ? (t.dispatch_dialog?.dispatching ?? "جاري الإرسال...") : (t.dispatch_dialog?.dispatch ?? "إرسال")}
            </Button>
          </>
        )}

        {/* ── No companies fallback ──────────────────────────────────────── */}
        {mode === "company" && !hasCompanyOption && (
          <p className="py-6 text-center text-sm text-muted-foreground font-semibold">
            {t.dispatch_dialog?.no_companies ?? "لا توجد شركات متصلة"}
          </p>
        )}

        {/* ── No driver option in this wilaya ────────────────────────────── */}
        {mode === "driver" && !hasDriverOption && (
          <p className="py-6 text-center text-sm text-muted-foreground font-semibold">
            {t.assign_driver_dialog?.no_drivers ?? "لا يوجد سائقون متاحون لهذه الولاية"}
          </p>
        )}
      </DialogContent>
      <ErrorModal isOpen={errorState.isOpen} onClose={() => setErrorState({ isOpen: false, message: "" })} message={errorState.message} locale={locale} errorCode={errorState.code} />
    </Dialog>
  );
}

// ── Row Actions ────────────────────────────────────────────────────────────

function OrderRowActions({
  order,
  drivers,
  companies,
  driverWilayas,
  userScopes,
  onRefresh,
}: {
  order: Order;
  drivers: Driver[];
  companies: DeliveryCompany[];
  driverWilayas: number[];
  userScopes: string[];
  onRefresh: () => void;
}) {
  const t = useOrders();
  const common = useCommon();
  const router = useRouter();
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();

  const hasScope = (scope: string) => userScopes.includes(scope) || userScopes.includes(SCOPES.ALL);

  const isDispatched = !!order.trackingNumber;
  const isDriverAssigned = !!order.driverId;
  const isCompanyMethod = isDispatched || order.deliveryMethod === "company";
  const isDriverMethod = order.deliveryMethod === "driver" && isDriverAssigned && !isDispatched;
  const isTerminal = ["shipped", "delivered", "returned", "cancelled"].includes(order.status);

  // Check if this order's wilaya has driver coverage
  const hasDriverCoverage = order.wilayaId != null && driverWilayas.includes(order.wilayaId);

  const showDelivery = hasScope(SCOPES.ORDERS_ASSIGN) || hasScope(SCOPES.DELIVERY_DISPATCH);
  const showDelete = hasScope(SCOPES.ORDERS_DELETE);

  async function handleDelete() {
    const ok = await confirmDialog({
      title: `${t.actions?.delete ?? "Delete"} ${order.orderNumber}?`,
      variant: "destructive",
      confirmLabel: common.delete ?? t.actions?.delete ?? "Delete",
    });
    if (!ok) return;
    startDeleteTransition(async () => {
      try {
        await deleteOrder(order.id);
        toast.success(t.actions?.delete ?? "Order deleted");
        onRefresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete order");
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger 
          disabled={isDeleting}
          render={<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" />}
        >
          <MoreHorizontal size={15} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}`)} disabled={isDeleting}>
            <Eye size={13} className="me-2" />
            {t.actions?.view ?? "View"}
          </DropdownMenuItem>
          {showDelivery && (
            <DropdownMenuItem onClick={() => setDeliveryOpen(true)} disabled={isDeleting}>
              <Truck size={13} className="me-2" />
              {t.actions?.delivery ?? "التوصيل"}
            </DropdownMenuItem>
          )}
          {showDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
              >
                {isDeleting ? (
                  <div className="w-3 h-3 me-2 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 size={13} className="me-2" />
                )}
                {t.actions?.delete ?? "Delete"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {ConfirmDialog}

      {deliveryOpen && (
        <DeliveryDialog
          order={order}
          drivers={drivers}
          companies={companies}
          driverWilayas={driverWilayas}
          onClose={() => setDeliveryOpen(false)}
          onAssigned={onRefresh}
          onDispatched={() => onRefresh()}
        />
      )}
    </>
  );
}

// ── Main table ─────────────────────────────────────────────────────────────

interface OrdersTableProps {
  orders: Order[];
  total: number;
  currentPage: number;
  pageSize: number;
  drivers?: Driver[];
  companies?: DeliveryCompany[];
  driverWilayas?: number[];
  userScopes?: string[];
  statusCounts?: Record<string, number>;
}

export function OrdersTable({
  orders,
  total,
  currentPage,
  pageSize,
  drivers = [],
  companies = [],
  driverWilayas = [],
  userScopes = [],
  statusCounts = {},
}: OrdersTableProps) {
  const t = useOrders();
  const common = useCommon();
  const { dir } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Filter state (synced with URL) ──────────────────────────────────────
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
  const [wilayaFilter, setWilayaFilter] = useState(searchParams.get("wilayaId") ?? "all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
    to: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
  });

  // ⚡ Sync statusFilter state with URL when chips change it
  useEffect(() => {
    const urlStatus = searchParams.get("status");
    const urlGroup = searchParams.get("group");
    setStatusFilter(urlStatus ?? (urlGroup ? "all" : "all"));
  }, [searchParams]);

  // ⚡ Sync debounced search to URL (replace for filter changes)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("q", debouncedSearch);
    } else {
      params.delete("q");
    }
    params.set("page", "1"); // Reset to page 1 on filter change
    router.replace(`/orders?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, router]);

  // ⚡ Sync other filters to URL (replace for filter changes)
  function handleFilterChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("page", "1"); // Reset to page 1 on filter change
    router.replace(`/orders?${params.toString()}`, { scroll: false });
  }

  // ⚡ Sync date range to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (dateRange.from) {
      params.set("startDate", dateRange.from.toISOString());
    } else {
      params.delete("startDate");
    }
    if (dateRange.to) {
      params.set("endDate", dateRange.to.toISOString());
    } else {
      params.delete("endDate");
    }
    params.set("page", "1"); // Reset to page 1 on filter change
    router.replace(`/orders?${params.toString()}`, { scroll: false });
  }, [dateRange, router]);

  // ⚡ Server-side filtering - orders are already filtered by the server
  const hasActiveFilter =
    searchParams.get("q")?.trim() !== "" ||
    searchParams.get("status") !== null ||
    searchParams.get("group") !== null ||
    searchParams.get("wilayaId") !== null ||
    searchParams.get("startDate") !== null ||
    searchParams.get("endDate") !== null;

  // Unique wilayas derived from current page orders (id + name pairs)
  const uniqueWilayas = useMemo(
    () => {
      const map = new Map<number, string>();
      orders.forEach((o) => {
        if (o.wilayaId && o.wilaya) map.set(o.wilayaId, o.wilaya);
      });
      return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    },
    [orders]
  );

  // ⚡ No client-side filtering - orders are already filtered by server
  const filtered = orders;

  // ── Bulk selection state ──────────────────────────────────────────────────
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkDispatchOpen, setBulkDispatchOpen] = useState(false);

  // Statuses eligible for bulk dispatch
  const BULK_DISPATCH_STATUSES: OrderStatus[] = ["new", "confirmed", "unreachable", "busy", "postponed"];

  // Filtered orders that are eligible for bulk dispatch
  const dispatchableOrders = useMemo(() => {
    return filtered.filter((o) =>
      BULK_DISPATCH_STATUSES.includes(o.status) &&
      !o.trackingNumber &&
      !o.driverId
    );
  }, [filtered]);

  const selectedDispatchableOrders = useMemo(() => {
    return dispatchableOrders.filter((o) => selectedOrderIds.has(o.id));
  }, [dispatchableOrders, selectedOrderIds]);

  function toggleSelectAll() {
    const allIds = new Set(dispatchableOrders.map((o) => o.id));
    if (selectedOrderIds.size === dispatchableOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(allIds);
    }
  }

  function toggleSelectOrder(id: string) {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleRefresh() {
    router.refresh();
  }

  // ── Total count for "All" chip ──────────────────────────────────────────────
  const totalCount = Object.values(statusCounts).reduce((sum, c) => sum + c, 0);

  const statChips = [
    { key: "all",       label: "الكل",           count: totalCount,         color: "bg-muted" },
    { key: "new",       label: t.status?.new ?? "جديد",         count: statusCounts["new"] ?? 0,       color: "bg-blue-500" },
    { key: "pending",   label: "قيد التأكيد",    count: (statusCounts["unreachable"] ?? 0) + (statusCounts["busy"] ?? 0) + (statusCounts["postponed"] ?? 0), color: "bg-amber-500" },
    { key: "confirmed", label: t.status?.confirmed ?? "مؤكدة",   count: statusCounts["confirmed"] ?? 0, color: "bg-indigo-500" },
    { key: "shipped",   label: t.status?.shipped ?? "قيد التوصيل",  count: statusCounts["shipped"] ?? 0,   color: "bg-teal-500" },
    { key: "fake",      label: t.status?.fake ?? "مزيفة",       count: statusCounts["fake"] ?? 0,      color: "bg-red-800" },
    { key: "cancelled", label: t.status?.cancelled ?? "ملغاة",   count: statusCounts["cancelled"] ?? 0, color: "bg-red-500" },
  ];

  // ── Column definitions ────────────────────────────────────────────────────
  const columns: TableColumn<Order>[] = [
    {
      key: "_select",
      label: "",
      render: (_value, row) => {
        const isDispatchable =
          BULK_DISPATCH_STATUSES.includes(row.status) &&
          !row.trackingNumber &&
          !row.driverId;
        return (
          <Checkbox
            checked={selectedOrderIds.has(row.id)}
            onCheckedChange={() => toggleSelectOrder(row.id)}
            disabled={!isDispatchable}
            className="data-[state=checked]:bg-primary"
          />
        );
      },
      className: "w-10",
    },
    {
      key: "orderNumber",
      label: t.table.product,
      sortable: true,
      isTitle: true,
      render: (_value, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm shrink-0 overflow-hidden">
            {row.firstProductImage ? (
              <img
                src={row.firstProductImage}
                alt={row.firstProductName ?? ""}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight truncate max-w-[160px]">
                {row.firstProductName || row.orderNumber}
              </span>
              {(row.hasReview ?? 0) > 0 && (
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              )}
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground/40 tabular-nums whitespace-nowrap">
              {formatRelativeTime(row.createdAt)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "customerName",
      label: t.table.customer,
      sortable: true,
      isSubtitle: true,
      render: (value) => (
        <span className="font-bold text-sm tracking-tight">{value}</span>
      ),
    },
    {
      key: "phone",
      label: t.table.phone,
      render: (value) => (
        <span className="text-[11px] font-bold text-foreground tabular-nums select-all whitespace-nowrap" dir="ltr">
          {value}
        </span>
      ),
      tabletHidden: true,
    },
    {
      key: "status",
      label: t.table.status,
      sortable: true,
      isStatus: true,
      render: (_value, row) => <StatusCell order={row} onRefresh={handleRefresh} />,
    },
    {
      key: "wilaya",
      label: t.table.wilaya,
      sortable: true,
      render: (value, row) => (
        <div className="flex items-start gap-1.5 min-w-0">
          <MapPin className="w-3 h-3 text-primary/40 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground/80 truncate">{value}</p>
            {row.commune && (
              <p className="text-[10px] font-semibold text-muted-foreground/50 truncate">
                {row.commune}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "price",
      label: t.table.price,
      sortable: true,
      render: (value) => (
        <span className="font-black text-sm text-primary tabular-nums">
          {formatPrice(value, common.currency.symbol)}
        </span>
      ),
      className: "text-right",
    },
    {
      key: "id",
      label: "",
      render: (_value, row) => (
        <OrderRowActions
          order={row}
          drivers={drivers}
          companies={companies}
          driverWilayas={driverWilayas}
          userScopes={userScopes}
          onRefresh={handleRefresh}
        />
      ),
      className: "w-10 text-end",
    },
  ];

  return (
    <div className="space-y-4">
      {/* ── Stat filter chips ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {statChips.map((chip) => {
          const isActive = chip.key === "all"
            ? statusFilter === "all" && !searchParams.get("group")
            : chip.key === "pending"
              ? searchParams.get("group") === "pending"
              : statusFilter === chip.key;

          return (
            <FilterChip
              key={chip.key}
              label={chip.label}
              count={chip.count}
              active={isActive}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete("status");
                params.delete("group");
                params.set("page", "1");
                if (chip.key === "all") {
                  // Already deleted status and group above
                } else if (chip.key === "pending") {
                  params.set("group", "pending");
                } else {
                  params.set("status", chip.key);
                }
                router.replace(`/orders?${params.toString()}`, { scroll: false });
              }}
              variant="status"
              statusColor={chip.color}
            />
          );
        })}
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2.5 flex-wrap">
        {/* Search - debounced */}
        <div className="relative flex-1 min-w-48 group">
          <Search className={cn(
            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 transition-colors group-focus-within:text-primary",
            dir === "rtl" ? "right-3.5" : "left-3.5"
          )} />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t.search_placeholder ?? "Search..."}
            className={cn(
              "bg-card border-border/60 shadow-xs h-10",
              dir === "rtl" ? "pr-10" : "pl-10",
              searchInput && (dir === "rtl" ? "pe-9" : "ps-9")
            )}
            dir={dir}
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors",
                dir === "rtl" ? "left-3" : "right-3"
              )}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status filter - server-side */}
        <Select value={statusFilter} onValueChange={(v) => handleFilterChange("status", v ?? "all")}>
          <SelectTrigger className="w-full sm:w-44 bg-card border-border/60 shadow-xs h-10">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Filter className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              <span className="truncate text-[13px] font-medium">
                {statusFilter === "all"
                  ? `${t.filters?.status ?? "Status"}`
                  : (t.status?.[statusFilter as OrderStatus] ?? statusFilter)}
              </span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.status?.all ?? "All Statuses"}</SelectItem>
            {FILTER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{t.status?.[s] ?? s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Wilaya filter - server-side */}
        {uniqueWilayas.length > 1 && (
          <Select value={wilayaFilter} onValueChange={(v) => handleFilterChange("wilayaId", v ?? "all")}>
            <SelectTrigger className="w-full sm:w-44 bg-card border-border/60 shadow-xs h-10">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                <span className="truncate text-[13px] font-medium">
                  {wilayaFilter === "all"
                    ? (t.filters?.wilaya ?? "Wilaya")
                    : uniqueWilayas.find(([id]) => String(id) === wilayaFilter)?.[1] ?? wilayaFilter}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.filters?.all_wilayas ?? "All Wilayas"}</SelectItem>
              {uniqueWilayas.map(([id, name]) => (
                <SelectItem key={id} value={String(id)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date range filter */}
        <DateRangePicker
          value={dateRange}
          onChange={(range) => setDateRange(range ?? { from: undefined, to: undefined })}
          className="w-full sm:w-auto"
        />
      </div>

      {/* ── Bulk action bar ──────────────────────────────────────────────── */}
      {selectedOrderIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedOrderIds.size === dispatchableOrders.length && dispatchableOrders.length > 0}
              onCheckedChange={toggleSelectAll}
              className="data-[state=checked]:bg-primary"
            />
            <span className="text-sm font-bold">
              {selectedOrderIds.size} / {dispatchableOrders.length} محدد
            </span>
          </div>
          <div className="flex-1" />
          <Button
            size="sm"
            onClick={() => setBulkDispatchOpen(true)}
            disabled={selectedDispatchableOrders.length === 0}
            className="gap-2"
          >
            <Truck size={14} />
            إرسال جماعي ({selectedDispatchableOrders.length})
          </Button>
        </div>
      )}

      {/* ── Data table (server-side filtered + paginated) ─ */}
      <DataTable
        data={filtered}
        columns={columns}
        searchable={false}
        filterable={false}
        pagination={false}
        emptyState={
          hasActiveFilter ? (
            <div className="py-10 text-center">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">
                {common.no_results_found ?? "No results"}
              </p>
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title={t.empty_state.title}
              description={t.empty_state.description}
              actionLabel={t.empty_state.action}
              onAction={() => router.push("/orders/new")}
            />
          )
        }
        renderMobileCard={(order) => {
          const company = companies.find((c) => c.id === order.companyId);
          return (
            <div className="flex flex-col gap-2 py-0.5">
              {/* Row 1: status + order# + actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <StatusCell order={order} onRefresh={handleRefresh} />
                  {order.lastUpdatedBy?.startsWith("webhook:") && (
                    <Zap size={10} className="text-primary shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {order.firstProductImage ? (
                    <img
                      src={order.firstProductImage}
                      alt={order.firstProductName ?? ""}
                      className="w-5 h-5 rounded object-cover"
                    />
                  ) : null}
                  <span className="text-[11px] font-bold text-muted-foreground/60 truncate max-w-[120px]">
                    {order.firstProductName || `#${order.orderNumber}`}
                  </span>
                  <OrderRowActions
                    order={order}
                    drivers={drivers}
                    companies={companies}
                    driverWilayas={driverWilayas}
                    userScopes={userScopes}
                    onRefresh={handleRefresh}
                  />
                </div>
              </div>

              {/* Row 2: customer name */}
              <p className="text-[16px] font-black text-foreground tracking-tight leading-snug truncate">
                {order.customerName}
              </p>
              <p className="text-[12px] font-semibold text-muted-foreground/60 tabular-nums select-all -mt-1.5" dir="ltr">
                {order.phone}
              </p>

              {/* Row 3: price + delivery type + date */}
              <div className="flex items-center justify-between gap-2 pt-2 pb-2.5 border-b border-border/10">
                <p className="text-[22px] font-black text-primary tabular-nums tracking-tight leading-none" dir="ltr">
                  {formatPrice(order.price, common.currency.symbol)}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-md",
                    order.deliveryType === "stop_desk"
                      ? "bg-amber-500/10 text-amber-600/80"
                      : "bg-primary/8 text-primary/70"
                  )}>
                    {order.deliveryType === "stop_desk"
                      ? <Store size={8} />
                      : <Home size={8} />}
                    {order.deliveryType === "stop_desk"
                      ? (t.detail?.stop_desk ?? "Desk")
                      : (t.detail?.home_delivery ?? "Home")}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground/35 tabular-nums whitespace-nowrap">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
              </div>

              {/* Row 4: location */}
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3 h-3 text-primary/40 shrink-0" />
                <p className="flex-1 min-w-0 text-[12px] font-semibold text-muted-foreground truncate">
                  {order.wilaya}{order.commune ? ` · ${order.commune}` : ""}
                </p>
              </div>

              {/* Row 5: dispatch info (if any) */}
              {(order.trackingNumber || order.driverName) && (
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-muted/30 border border-border/20">
                  {order.trackingNumber ? (
                    <Building2 size={11} className="text-primary/50 shrink-0" />
                  ) : (
                    <Truck size={11} className="text-muted-foreground/50 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/50 truncate">
                      {order.trackingNumber
                        ? (company?.name ?? t.detail?.company ?? "Company")
                        : (t.detail?.driver ?? "Driver")}
                    </p>
                    {order.trackingNumber && (
                      <p className="font-mono text-[11px] font-black text-primary/70 tracking-tight truncate select-all" dir="ltr">
                        {order.trackingNumber}
                      </p>
                    )}
                    {!order.trackingNumber && order.driverName && (
                      <p className="text-[11px] font-bold text-foreground/70 truncate">
                        {order.driverName}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        }}
      />

      {/* ── Server-side pagination ──────────────────────────────────────── */}
      {total > pageSize && (
        <div className="flex items-center justify-between pt-4 border-t border-border/20">
          <p className="text-xs font-bold text-muted-foreground/60">
            عرض {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, total)} من {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(currentPage - 1));
                router.push(`/orders?${params.toString()}`);
              }}
              disabled={currentPage <= 1}
              className="h-8 px-3 text-xs font-bold"
            >
              السابق
            </Button>
            {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1)
              .filter((page) => {
                const totalPages = Math.ceil(total / pageSize);
                return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
              })
              .map((page, idx, arr) => (
                <span key={page} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="px-1 text-xs text-muted-foreground/40">...</span>
                  )}
                  <Button
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("page", String(page));
                      router.push(`/orders?${params.toString()}`);
                    }}
                    className="h-8 w-8 p-0 text-xs font-bold"
                  >
                    {page}
                  </Button>
                </span>
              ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(currentPage + 1));
                router.push(`/orders?${params.toString()}`);
              }}
              disabled={currentPage >= Math.ceil(total / pageSize)}
              className="h-8 px-3 text-xs font-bold"
            >
              التالي
            </Button>
          </div>
        </div>
      )}

      {/* ── Bulk dispatch dialog ────────────────────────────────────────── */}
      <BulkDispatchDialog
        open={bulkDispatchOpen}
        onOpenChange={setBulkDispatchOpen}
        selectedOrders={selectedDispatchableOrders}
        companies={companies}
        onComplete={() => {
          setSelectedOrderIds(new Set());
          handleRefresh();
        }}
      />
    </div>
  );
}
