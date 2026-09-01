"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, RefreshCw } from "lucide-react";
import { useGiftCards } from "@/lib/translations";
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
import { FormSection as Section, FormField as Field } from "@/components/ui/form-section";
import { ContextualSaveBar } from "@/components/ui/contextual-save-bar";
import { FormHeader } from "@/components/ui/form-header";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";


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

  const { isDirty, markDirty, resetDirty } = useUnsavedChanges();

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
          resetDirty();
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
          resetDirty();
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
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-fade-in">
      <FormHeader backHref="/store/gift-cards" title={mode === "create" ? (t.form?.create ?? "Create Gift Card") : (t.form?.save ?? "Save Changes")} />
      <ContextualSaveBar
        hasChanges={isDirty}
        isSaving={isSaving}
        onSave={async () => {
          const form = document.querySelector("form");
          if (form) form.requestSubmit();
        }}
        onCancel={() => router.push("/store/gift-cards")}
        onDiscard={() => router.push("/store/gift-cards")}
      />

      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-6">
          {/* Main column */}
          <div className="flex-1 min-w-0 space-y-6">
            <Section title={t.form?.card_info ?? "Card Information"} icon={<Gift size={18} />}>
              <div className="space-y-5">
                <Field label={`${t.form?.code ?? "Code"} *`}>
                  <div className="flex gap-2">
                    <Input
                      value={code}
                      onChange={(e) => { setCode(e.target.value.toUpperCase()); markDirty(); }}
                      placeholder="XXXXXXXXXX"
                      required
                      className="font-mono h-11 bg-card border-border rounded-md px-4 text-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => { setCode(generateCode()); markDirty(); }}
                      title={t.form?.generate ?? "Generate"}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </Field>

                <Field label={`${t.form?.amount ?? "Initial Amount (DZD)"} *`}>
                  <Input
                    type="number"
                    value={initialAmount}
                    onChange={(e) => { setInitialAmount(e.target.value); markDirty(); }}
                    min="1"
                    required
                    placeholder="5000"
                    className="h-11 bg-card border-border rounded-md px-4 text-sm tabular-nums"
                  />
                </Field>

                {mode === "edit" && (
                  <Field label={t.form?.status ?? "Status"}>
                    <Select value={status} onValueChange={(v) => { setStatus(v ?? "active"); markDirty(); }}>
                      <SelectTrigger className="h-11 bg-card border-border rounded-md px-4 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t.status?.active ?? "Active"}</SelectItem>
                        <SelectItem value="used">{t.status?.used ?? "Used"}</SelectItem>
                        <SelectItem value="expired">{t.status?.expired ?? "Expired"}</SelectItem>
                        <SelectItem value="disabled">{t.status?.disabled ?? "Disabled"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                <Field label={t.form?.expires_at ?? "Expiry Date"}>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => { setExpiresAt(e.target.value); markDirty(); }}
                    className="h-11 bg-card border-border rounded-md px-4 text-sm"
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* Sidebar */}
          <div className="w-[320px] shrink-0 space-y-6">
            <Section title={t.form?.recipient_info ?? "Recipient Information"} icon={<Gift size={18} />}>
              <div className="space-y-5">
                <Field label={t.form?.recipient_name ?? "Recipient Name"}>
                  <Input
                    value={recipientName}
                    onChange={(e) => { setRecipientName(e.target.value); markDirty(); }}
                    placeholder={t.form?.recipient_name_placeholder ?? "Enter recipient name"}
                    className="h-11 bg-card border-border rounded-md px-4 text-sm"
                  />
                </Field>

                <Field label={t.form?.recipient_phone ?? "Recipient Phone"}>
                  <Input
                    value={recipientPhone}
                    onChange={(e) => { setRecipientPhone(e.target.value); markDirty(); }}
                    placeholder="0555123456"
                    className="h-11 bg-card border-border rounded-md px-4 text-sm"
                  />
                </Field>

                <Field label={t.form?.recipient_email ?? "Recipient Email"}>
                  <Input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => { setRecipientEmail(e.target.value); markDirty(); }}
                    placeholder="recipient@example.com"
                    className="h-11 bg-card border-border rounded-md px-4 text-sm"
                  />
                </Field>

                <Field label={t.form?.sender_name ?? "Sender Name"}>
                  <Input
                    value={senderName}
                    onChange={(e) => { setSenderName(e.target.value); markDirty(); }}
                    placeholder={t.form?.sender_name_placeholder ?? "Enter sender name"}
                    className="h-11 bg-card border-border rounded-md px-4 text-sm"
                  />
                </Field>

                <Field label={t.form?.message ?? "Message"}>
                  <Textarea
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); markDirty(); }}
                    placeholder={t.form?.message_placeholder ?? "Enter a personal message"}
                    rows={3}
                    className="h-11 min-h-[80px] bg-card border-border rounded-md px-4 text-sm resize-none"
                  />
                </Field>
              </div>
            </Section>
          </div>
        </div>
      </form>
    </div>
  );
}
