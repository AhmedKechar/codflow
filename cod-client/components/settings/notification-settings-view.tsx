"use client";

import { useState, useTransition } from "react";
import { Save, Loader2, Bell, MessageSquare, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCommon } from "@/lib/translations";
import {
  updateNotificationSetting,
  type NotificationSetting,
} from "@/actions/notification-settings";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: "جديد", color: "bg-blue-100 text-blue-800" },
  confirmed: { label: "تم التأكيد", color: "bg-indigo-100 text-indigo-800" },
  unreachable: { label: "لا يرد", color: "bg-gray-100 text-gray-800" },
  busy: { label: "الخط مشغول", color: "bg-amber-100 text-amber-800" },
  postponed: { label: "مؤجل", color: "bg-purple-100 text-purple-800" },
  shipped: { label: "قيد التوصيل", color: "bg-teal-100 text-teal-800" },
  delivered: { label: "تم التسليم", color: "bg-green-100 text-green-800" },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-800" },
  fake: { label: "مزيف", color: "bg-red-100 text-red-800" },
  duplicate: { label: "مكرر", color: "bg-slate-100 text-slate-800" },
  returned: { label: "مرتجع", color: "bg-orange-100 text-orange-800" },
};

const CHANNEL_OPTIONS = [
  { value: "both", label: "واتساب + SMS", icon: MessageSquare },
  { value: "whatsapp", label: "واتساب فقط", icon: MessageSquare },
  { value: "sms", label: "SMS فقط", icon: Smartphone },
];

interface Props {
  initialSettings: NotificationSetting[];
}

export function NotificationSettingsView({ initialSettings }: Props) {
  const common = useCommon();
  const [settings, setSettings] = useState<NotificationSetting[]>(initialSettings);
  const [isPending, startTransition] = useTransition();

  function getSetting(status: string): NotificationSetting | undefined {
    return settings.find((s) => s.orderStatus === status);
  }

  function updateLocalSetting(status: string, updates: Partial<NotificationSetting>) {
    setSettings((prev) =>
      prev.map((s) =>
        s.orderStatus === status ? { ...s, ...updates } : s
      )
    );
  }

  function handleSaveAll() {
    startTransition(async () => {
      try {
        const promises = settings.map((s) =>
          updateNotificationSetting({
            orderStatus: s.orderStatus,
            channel: s.channel,
            enabled: s.enabled,
            templateWhatsapp: s.templateWhatsapp ?? undefined,
            templateSms: s.templateSms ?? undefined,
          })
        );
        await Promise.all(promises);
        toast.success("تم حفظ جميع الإعدادات بنجاح");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "حدث خطأ");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header with save button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {settings.filter((s) => s.enabled).length} من {settings.length} مفعّل
          </span>
        </div>
        <Button onClick={handleSaveAll} disabled={isPending}>
          {isPending ? (
            <Loader2 className="w-4 h-4 me-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 me-2" />
          )}
          حفظ الكل
        </Button>
      </div>

      {/* Status notification cards */}
      <div className="grid gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const setting = getSetting(status);
          const enabled = setting?.enabled ?? false;
          const channel = setting?.channel ?? "both";

          return (
            <div
              key={status}
              className="rounded-lg border p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={config.color}>{config.label}</Badge>
                  <span className="text-sm text-muted-foreground">
                    إشعار عند变为 {config.label}
                  </span>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    updateLocalSetting(status, { enabled: checked })
                  }
                />
              </div>

              {enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label>قناة الإرسال</Label>
                    <Select
                      value={channel}
                      onValueChange={(v) =>
                        updateLocalSetting(status, {
                          channel: v as "whatsapp" | "sms" | "both",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHANNEL_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>قالب الرسالة (اختياري)</Label>
                    <Textarea
                      value={setting?.templateWhatsapp ?? ""}
                      onChange={(e) =>
                        updateLocalSetting(status, {
                          templateWhatsapp: e.target.value || undefined,
                        })
                      }
                      rows={2}
                      placeholder={`رسالة افتراضية عند ${config.label}...`}
                    />
                    <p className="text-xs text-muted-foreground">
                      المتغيرات: {"{{customerName}}"} {"{{orderNumber}}"} {"{{status}}"} {"{{trackingNumber}}"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
