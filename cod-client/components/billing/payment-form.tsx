"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBilling, useCommon } from "@/lib/translations";
import { submitPayment } from "@/actions/payments";
import { cn } from "@/lib/utils";

interface Props {
  plan: any;
  subscription: any;
  userScopes: string[];
}

const PAYMENT_METHODS = [
  { id: "ccp", labelKey: "ccp", accountInfo: "00799999 00 XXXXXXXX" },
  { id: "baridi_mob", labelKey: "baridi_mob", accountInfo: "00799999 00 XXXXXXXX" },
  { id: "wise", labelKey: "wise", accountInfo: "your@email.com" },
  { id: "redotpay", labelKey: "redotpay", accountInfo: "your@email.com" },
];

export function PaymentForm({ plan, subscription, userScopes }: Props) {
  const t = useBilling();
  const common = useCommon();
  const router = useRouter();

  const [amount, setAmount] = useState(String(plan.priceDzd ?? ""));
  const [paymentMethod, setPaymentMethod] = useState("ccp");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod);

  const handleSubmit = async () => {
    if (!amount || !paymentMethod || !referenceNumber) return;

    setLoading(true);
    setToast(null);

    try {
      await submitPayment({
        subscriptionId: subscription?.id ?? "",
        amountDzd: Number(amount),
        paymentMethod,
        referenceNumber,
        receiptUrl: receiptFile ? URL.createObjectURL(receiptFile) : undefined,
      });

      setToast({ type: "success", message: t.payment_submitted });

      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error: any) {
      setToast({
        type: "error",
        message: error?.message ?? common.error_occurred,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.submit_payment}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>{t.payment_amount}</Label>
          <div className="relative">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t.enter_amount}
              min={0}
            />
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
              {t.currency}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t.payment_method}</Label>
          <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v ?? "ccp")}>
            <SelectTrigger>
              <SelectValue placeholder={t.select_payment_method} />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  {t[method.labelKey as keyof typeof t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedMethod && (
          <div className="rounded-xl bg-muted/30 border border-border/40 p-3 text-xs text-muted-foreground">
            <span className="font-bold text-foreground">
              {t.payment_methods}:
            </span>{" "}
            {selectedMethod.accountInfo}
          </div>
        )}

        <div className="space-y-2">
          <Label>{t.reference_number}</Label>
          <Input
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder={t.reference_number}
          />
        </div>

        <div className="space-y-2">
          <Label>{t.upload_receipt}</Label>
          <div className="flex items-center gap-3">
            <label
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors text-sm",
                receiptFile && "border-border bg-muted/30"
              )}
            >
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="font-bold text-foreground">
                {receiptFile ? receiptFile.name : t.receipt_file}
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

        {toast && (
          <div
            className={cn(
              "flex items-center gap-2 p-3 rounded-xl text-sm font-bold",
              toast.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            )}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {toast.message}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          variant="default"
          className="w-full"
          disabled={loading || !amount || !paymentMethod || !referenceNumber}
          onClick={handleSubmit}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin me-2" />
          ) : null}
          {t.confirm_payment}
        </Button>
      </CardFooter>
    </Card>
  );
}
