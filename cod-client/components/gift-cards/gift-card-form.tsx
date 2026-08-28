"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Loader2, RefreshCw } from "lucide-react";
import { useGiftCards } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createGiftCardAction, updateGiftCardAction } from "@/actions/gift-cards";
import type { GiftCard } from "@/actions/gift-cards";
import { toast } from "sonner";

interface GiftCardFormProps {
  initialData?: GiftCard;
  mode?: "create" | "edit";
}

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function GiftCardForm({ initialData, mode = "create" }: GiftCardFormProps) {
  const t = useGiftCards();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [code, setCode] = useState(initialData?.code ?? generateCode());
  const [initialAmount, setInitialAmount] = useState(initialData?.initialAmountDzd?.toString() ?? "");
  const [recipientName, setRecipientName] = useState(initialData?.recipientName ?? "");
  const [recipientPhone, setRecipientPhone] = useState(initialData?.recipientPhone ?? "");
  const [recipientEmail, setRecipientEmail] = useState(initialData?.recipientEmail ?? "");
  const [senderName, setSenderName] = useState(initialData?.senderName ?? "");
  const [message, setMessage] = useState(initialData?.message ?? "");
  const [expiresAt, setExpiresAt] = useState(initialData?.expiresAt?.split("T")[0] ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "active");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (mode === "create") {
        const result = await createGiftCardAction({
          code,
          initialAmountDzd: Number(initialAmount),
          recipientName: recipientName || undefined,
          recipientPhone: recipientPhone || undefined,
          recipientEmail: recipientEmail || undefined,
          senderName: senderName || undefined,
          message: message || undefined,
          expiresAt: expiresAt || undefined,
        });

        if (result.success) {
          toast.success(t.toast?.created ?? "Gift card created successfully");
          router.push("/store/gift-cards");
        } else {
          toast.error(result.error || (t.toast?.error ?? "Failed to create gift card"));
        }
      } else if (initialData) {
        const result = await updateGiftCardAction(initialData.id, {
          code,
          initialAmountDzd: Number(initialAmount),
          recipientName: recipientName || undefined,
          recipientPhone: recipientPhone || undefined,
          recipientEmail: recipientEmail || undefined,
          senderName: senderName || undefined,
          message: message || undefined,
          expiresAt: expiresAt || undefined,
          status,
        });

        if (result.success) {
          toast.success(t.toast?.updated ?? "Gift card updated successfully");
          router.push("/store/gift-cards");
        } else {
          toast.error(result.error || (t.toast?.error ?? "Failed to update gift card"));
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Gift size={20} className="text-primary" />
          {t.form?.card_info ?? "Card Information"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t.form?.code ?? "Code"} *
            </label>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXXXX"
                required
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCode(generateCode())}
                title={t.form?.generate ?? "Generate"}
              >
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t.form?.amount ?? "Initial Amount (DZD)"} *
            </label>
            <Input
              type="number"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              min="1"
              required
              placeholder="5000"
            />
          </div>

          {mode === "edit" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t.form?.status ?? "Status"}
              </label>
              <Select value={status} onValueChange={(v) => setStatus(v ?? "active")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t.status?.active ?? "Active"}</SelectItem>
                  <SelectItem value="used">{t.status?.used ?? "Used"}</SelectItem>
                  <SelectItem value="expired">{t.status?.expired ?? "Expired"}</SelectItem>
                  <SelectItem value="disabled">{t.status?.disabled ?? "Disabled"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t.form?.expires_at ?? "Expiry Date"}
            </label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          {t.form?.recipient_info ?? "Recipient Information"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t.form?.recipient_name ?? "Recipient Name"}
            </label>
            <Input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder={t.form?.recipient_name_placeholder ?? "Enter recipient name"}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t.form?.recipient_phone ?? "Recipient Phone"}
            </label>
            <Input
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="0555123456"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t.form?.recipient_email ?? "Recipient Email"}
            </label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t.form?.sender_name ?? "Sender Name"}
            </label>
            <Input
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder={t.form?.sender_name_placeholder ?? "Enter sender name"}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {t.form?.message ?? "Message"}
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.form?.message_placeholder ?? "Enter a personal message"}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/store/gift-cards")}
          disabled={isSaving}
        >
          {t.form?.cancel ?? "Cancel"}
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 size={16} className="mr-2 animate-spin" />}
          {mode === "create" ? (t.form?.create ?? "Create Gift Card") : (t.form?.save ?? "Save Changes")}
        </Button>
      </div>
    </form>
  );
}
