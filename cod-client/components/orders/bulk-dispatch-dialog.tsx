"use client";

import { useState, useTransition } from "react";
import { Truck, Loader2, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { bulkDispatchOrders } from "@/actions/orders";
import type { DeliveryCompany, Order } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrders: Order[];
  companies: DeliveryCompany[];
  onComplete: () => void;
}

interface DispatchResult {
  orderId: string;
  orderNumber: string;
  trackingNumber?: string;
  error?: string;
}

export function BulkDispatchDialog({
  open,
  onOpenChange,
  selectedOrders,
  companies,
  onComplete,
}: Props) {
  const [companyId, setCompanyId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<DispatchResult[] | null>(null);

  const activeCompanies = companies.filter((c) => c.active);
  const selectedCompany = activeCompanies.find((c) => c.id === companyId);

  function handleDispatch() {
    if (!companyId || selectedOrders.length === 0) return;

    startTransition(async () => {
      try {
        const result = await bulkDispatchOrders(
          companyId,
          selectedOrders.map((o) => o.id)
        );

        setResults(result.results);

        if (result.results.some((r) => r.trackingNumber)) {
          toast.success(`تم إرسال ${result.results.filter((r) => r.trackingNumber).length} طلب بنجاح`);
        }
        if (result.results.some((r) => r.error)) {
          toast.error(`فشل إرسال ${result.results.filter((r) => r.error).length} طلب`);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "حدث خطأ");
      }
    });
  }

  function handleClose() {
    setResults(null);
    setCompanyId("");
    onOpenChange(false);
    onComplete();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            إرسال جماعي للشحن
          </DialogTitle>
        </DialogHeader>

        {!results ? (
          <>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                تحديد {selectedOrders.length} طلب للإرسال
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">شركة الشحن</label>
                <Select value={companyId} onValueChange={(v) => setCompanyId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر شركة الشحن" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.nameAr || company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCompany && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p><strong>{selectedCompany.nameAr || selectedCompany.name}</strong></p>
                  <p className="text-muted-foreground mt-1">
                    {selectedCompany.supportsHomeDelivery && "توصيل للمنزل "}
                    {selectedCompany.supportsStopDesk && "· نقاط الاستلام"}
                  </p>
                </div>
              )}

              <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      تأكيد الإرسال الجماعي
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      سيتم إرسال جميع الطلبات المحددة إلى شركة الشحن. هل أنت متأكد؟
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isPending}>
                إلغاء
              </Button>
              <Button
                onClick={handleDispatch}
                disabled={!companyId || isPending || selectedOrders.length === 0}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                ) : (
                  <Truck className="w-4 h-4 me-2" />
                )}
                إرسال {selectedOrders.length} طلب
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.orderId}
                  className="flex items-center justify-between p-2 rounded-md border"
                >
                  <div className="flex items-center gap-2">
                    {result.trackingNumber ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">{result.orderNumber}</span>
                  </div>
                  {result.trackingNumber ? (
                    <Badge variant="outline" className="font-mono text-xs">
                      {result.trackingNumber}
                    </Badge>
                  ) : (
                    <span className="text-xs text-red-600">{result.error}</span>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>إغلاق</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
