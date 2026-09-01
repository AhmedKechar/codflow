"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, MessageSquare, Smartphone, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useMessaging } from "@/lib/translations";
import { sendWhatsAppMessage } from "@/actions/whatsapp";
import { sendSmsMessage } from "@/actions/sms";
import { cn } from "@/lib/utils";
import { FormSection as Section, FormField as Field } from "@/components/ui/form-section";
import { ContextualSaveBar } from "@/components/ui/contextual-save-bar";
import { FormHeader } from "@/components/ui/form-header";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

const PHONE_REGEX = /^(?:0[567]\d{8}|0[234]\d{7}|\+213[567]\d{8}|\+213[234]\d{7})$/;

export function MessageForm() {
  const t = useMessaging();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [phone, setPhone] = useState("");
  const [messageType, setMessageType] = useState<"order_update" | "marketing" | "support" | "automated">("order_update");
  const [channel, setChannel] = useState<"whatsapp" | "sms" | "both">("whatsapp");
  const [content, setContent] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const { isDirty, markDirty, resetDirty } = useUnsavedChanges();

  function validatePhone(value: string): boolean {
    const cleaned = value.replace(/[\s\-()]/g, "");
    if (!PHONE_REGEX.test(cleaned)) {
      setPhoneError(t.form.error_invalid_phone);
      return false;
    }
    setPhoneError("");
    return true;
  }

  function handlePhoneChange(value: string) {
    setPhone(value);
    if (phoneError) {
      validatePhone(value);
    }
    markDirty();
  }

  function handleSubmit() {
    if (!validatePhone(phone)) return;

    const data = {
      phoneNumber: phone.replace(/[\s\-()]/g, ""),
      messageType,
      content: content.trim() || undefined,
    };

    startTransition(async () => {
      try {
        const results: string[] = [];

        if (channel === "whatsapp" || channel === "both") {
          await sendWhatsAppMessage(data);
          results.push(t.channel.whatsapp);
        }

        if (channel === "sms" || channel === "both") {
          await sendSmsMessage(data);
          results.push(t.channel.sms);
        }

        toast.success(`${t.form.success} (${results.join(" + ")})`);
        resetDirty();
        setPhone("");
        setContent("");
        setMessageType("order_update");
        setChannel("whatsapp");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.form.error);
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto pb-16 space-y-6 animate-fade-in">
      <FormHeader backHref="/messaging" title={t.form.title ?? "Send New Message"} />
      <ContextualSaveBar
        hasChanges={isDirty}
        isSaving={isPending}
        onSave={handleSubmit}
        onCancel={() => router.push("/messaging")}
        onDiscard={() => router.push("/messaging")}
      />

      <Section title={t.form.title ?? "Send New Message"} icon={<MessageSquare size={18} />}>
        <div className="space-y-5">
          <Field label={`${t.form.phone_label} *`}>
            <Input
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder={t.form.phone_placeholder}
              className={cn(
                "h-11 bg-card border-border rounded-md px-4 text-sm",
                phoneError && "border-destructive focus-visible:ring-destructive"
              )}
              dir="ltr"
              disabled={isPending}
            />
            {phoneError && (
              <p className="flex items-center gap-1 text-xs text-destructive mt-1 ms-1 font-medium">
                <AlertCircle size={11} />
                {phoneError}
              </p>
            )}
            {!phoneError && (
              <p className="text-[10px] text-muted-foreground/50 font-semibold ms-1">{t.form.phone_hint}</p>
            )}
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t.form.type_label}>
              <Select value={messageType} onValueChange={(v) => { setMessageType(v as typeof messageType); markDirty(); }}>
                <SelectTrigger className="h-11 bg-card border-border rounded-md px-4 text-sm" disabled={isPending}>
                  <span>{t.message_type[messageType]}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order_update">{t.message_type.order_update}</SelectItem>
                  <SelectItem value="marketing">{t.message_type.marketing}</SelectItem>
                  <SelectItem value="support">{t.message_type.support}</SelectItem>
                  <SelectItem value="automated">{t.message_type.automated}</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label={t.form.channel_label}>
              <Select value={channel} onValueChange={(v) => { setChannel(v as typeof channel); markDirty(); }}>
                <SelectTrigger className="h-11 bg-card border-border rounded-md px-4 text-sm" disabled={isPending}>
                  <span>{t.channel[channel]}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">
                    <span className="flex items-center gap-2">
                      <MessageSquare size={13} className="text-green-600" />
                      {t.channel.whatsapp}
                    </span>
                  </SelectItem>
                  <SelectItem value="sms">
                    <span className="flex items-center gap-2">
                      <Smartphone size={13} className="text-muted-foreground" />
                      {t.channel.sms}
                    </span>
                  </SelectItem>
                  <SelectItem value="both">
                    <span className="flex items-center gap-2">
                      <MessageSquare size={13} className="text-green-600" />
                      <Smartphone size={13} className="text-muted-foreground" />
                      {t.channel.both}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label={t.form.content_label}>
            <Textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); markDirty(); }}
              placeholder={t.form.content_placeholder}
              className="min-h-[120px] bg-card border-border rounded-md px-4 text-sm resize-none"
              disabled={isPending}
            />
            <p className="text-[10px] text-muted-foreground/50 font-semibold ms-1">{t.form.content_hint}</p>
          </Field>
        </div>
      </Section>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!phone || isPending}
          className="h-10 rounded-md bg-primary text-primary-foreground font-medium px-6"
        >
          {isPending ? (
            <>
              <div className="w-3 h-3 me-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              {t.form.sending}
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5 me-2" />
              {t.form.send}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
