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
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-white/40 dark:bg-white/5 backdrop-blur-xl shadow-sm p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">
            {t.form.phone_label}
          </label>
          <Input
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder={t.form.phone_placeholder}
            className={cn(
              "h-10 text-sm font-bold",
              phoneError && "border-rose-400 focus-visible:ring-rose-400",
            )}
            dir="ltr"
          />
          {phoneError && (
            <p className="text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle size={11} />
              {phoneError}
            </p>
          )}
          {!phoneError && (
            <p className="text-[10px] text-muted-foreground/50 font-semibold">{t.form.phone_hint}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">
              {t.form.type_label}
            </label>
            <Select value={messageType} onValueChange={(v) => setMessageType(v as typeof messageType)}>
              <SelectTrigger className="h-10 text-sm">
                <span>{t.message_type[messageType]}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order_update">{t.message_type.order_update}</SelectItem>
                <SelectItem value="marketing">{t.message_type.marketing}</SelectItem>
                <SelectItem value="support">{t.message_type.support}</SelectItem>
                <SelectItem value="automated">{t.message_type.automated}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">
              {t.form.channel_label}
            </label>
            <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
              <SelectTrigger className="h-10 text-sm">
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
                    <Smartphone size={13} className="text-primary" />
                    {t.channel.sms}
                  </span>
                </SelectItem>
                <SelectItem value="both">
                  <span className="flex items-center gap-2">
                    <MessageSquare size={13} className="text-green-600" />
                    <Smartphone size={13} className="text-primary" />
                    {t.channel.both}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">
            {t.form.content_label}
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t.form.content_placeholder}
            className="min-h-[120px] text-sm resize-none"
          />
          <p className="text-[10px] text-muted-foreground/50 font-semibold">{t.form.content_hint}</p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!phone || isPending}
          className="w-full sm:w-auto h-10 rounded-xl bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-95 transition-all px-6"
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
