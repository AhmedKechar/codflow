"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n-context";
import { OrderStatusBadge } from "./order-status-badge";
import type { RecentOrder } from "@/../cod-shared/queries/analytics";

interface RecentOrdersProps {
  data: RecentOrder[];
}

const WILAYA_MAP: Record<number, string> = {
  1: "أدرار", 2: "الشلف", 3: "الأغواط", 4: "أم البواقي", 5: "باتنة",
  6: "بجاية", 7: "بسكرة", 8: "بشار", 9: "البليدة", 10: "البويرة",
  11: "تمنراست", 12: "تبسة", 13: "تلمسان", 14: "تيارت", 15: "تيزي وزو",
  16: "الجزائر", 17: "الجلفة", 18: "جيجل", 19: "سطيف", 20: "سعيدة",
  21: "سكيكدة", 22: "سيدي بلعباس", 23: "عنابة", 24: "قالمة", 25: "قسنطينة",
  26: "المدية", 27: "مستغانم", 28: "المسيلة", 29: "معسكر", 30: "ورقلة",
  31: "وهران", 32: "البيض", 33: "إليزي", 34: "برج بوعريريج", 35: "بومرداس",
  36: "الطارف", 37: "تندوف", 38: "تيسمسيلت", 39: "الوادي", 40: "خنشلة",
  41: "سوق أهراس", 42: "تيبازة", 43: "ميلة", 44: "عين الدفلى", 45: "النعامة",
  46: "عين تموشنت", 47: "غرداية", 48: "غليزان", 49: "تيميمون", 50: "برج باجي مختار",
  51: "أولاد جلال", 52: "بني عباس", 53: "عين صالح", 54: "عين قزام", 55: "توقرت",
  56: "جانت", 57: "المغير", 58: "المنيعة",
};

export function RecentOrders({ data }: RecentOrdersProps) {
  const { locale } = useLanguage();

  const fmt = (n: number) =>
    n.toLocaleString(locale === "ar" ? "ar-DZ" : "en", {
      maximumFractionDigits: 0,
    });

  const fmtDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString(locale === "ar" ? "ar-DZ" : "en", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <p className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-widest">
          لا توجد بيانات
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-start py-2 px-2 text-xs font-semibold text-muted-foreground/40 uppercase tracking-widest">
              رقم الطلب
            </th>
            <th className="text-start py-2 px-2 text-xs font-semibold text-muted-foreground/40 uppercase tracking-widest">
              العميل
            </th>
            <th className="text-start py-2 px-2 text-xs font-semibold text-muted-foreground/40 uppercase tracking-widest">
              الولاية
            </th>
            <th className="text-start py-2 px-2 text-xs font-semibold text-muted-foreground/40 uppercase tracking-widest">
              المبلغ
            </th>
            <th className="text-start py-2 px-2 text-xs font-semibold text-muted-foreground/40 uppercase tracking-widest">
              الحالة
            </th>
            <th className="text-start py-2 px-2 text-xs font-semibold text-muted-foreground/40 uppercase tracking-widest">
              التاريخ
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((order) => (
            <tr key={order.id} className="border-b border-border/30 hover:bg-muted/50 transition-colors">
              <td className="py-2 px-2">
                <Link
                  href={`/orders/${order.id}`}
                  className="font-mono text-xs text-blue-500 hover:underline"
                >
                  {order.orderNumber}
                </Link>
              </td>
              <td className="py-2 px-2 text-sm font-medium">{order.customerName}</td>
              <td className="py-2 px-2 text-sm text-muted-foreground">
                {WILAYA_MAP[order.wilayaId ?? 0] ?? "—"}
              </td>
              <td className="py-2 px-2 text-sm font-medium">{fmt(order.price)} دج</td>
              <td className="py-2 px-2">
                <OrderStatusBadge status={order.status} className="scale-90 origin-right" />
              </td>
              <td className="py-2 px-2 text-xs text-muted-foreground">{fmtDate(order.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
