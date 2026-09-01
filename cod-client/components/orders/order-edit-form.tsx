"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { useCommon } from "@/lib/translations";
import { updateOrder } from "@/actions/orders";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/types";

interface Props {
  order: Order;
  wilayas: Array<{ id: number; nameAr: string; name?: string }>;
  communes: Array<{ id: string; nameAr: string; name?: string; wilayaId: number }>;
}

export function OrderEditForm({ order, wilayas, communes }: Props) {
  const common = useCommon();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [customerName, setCustomerName] = useState(order.customerName);
  const [phone, setPhone] = useState(order.phone);
  const [wilayaId, setWilayaId] = useState(order.wilayaId ?? 0);
  const [communeId, setCommuneId] = useState((order as any).communeId ?? "");
  const [address, setAddress] = useState(order.address ?? "");
  const [price, setPrice] = useState(order.price);
  const [deliveryFee, setDeliveryFee] = useState(order.deliveryFee);
  const [deliveryType, setDeliveryType] = useState<"home" | "stop_desk">(order.deliveryType);
  const [notes, setNotes] = useState(order.notes ?? "");
  const [weight, setWeight] = useState(order.weight != null ? String(order.weight) : "");
  const [isFragile, setIsFragile] = useState(order.isFragile ?? false);

  const filteredCommunes = communes.filter((c) => c.wilayaId === wilayaId);
  const codAmount = price + deliveryFee;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const result = await updateOrder(order.id, {
        customerName,
        phone,
        wilayaId,
        communeId,
        address,
        price,
        deliveryFee,
        deliveryType,
        notes: notes || null,
        weight: weight ? parseFloat(weight) : null,
        isFragile,
      });

      if (result.ok) {
        toast.success("تم التحديث بنجاح");
        router.push(`/orders/${order.id}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Info */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="font-medium">معلومات العميل</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">اسم العميل</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">الهاتف</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              pattern="^0[5-7]\d{8}$"
              required
            />
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="font-medium">الموقع</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>الولاية</Label>
            <Select
              value={String(wilayaId)}
              onValueChange={(v) => {
                setWilayaId(Number(v));
                setCommuneId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الولاية" />
              </SelectTrigger>
              <SelectContent>
                {wilayas.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.nameAr} {w.name ? `(${w.name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>البلدية</Label>
            <Select value={communeId} onValueChange={setCommuneId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر البلدية" />
              </SelectTrigger>
              <SelectContent>
                {filteredCommunes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nameAr} {c.name ? `(${c.name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">العنوان</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="font-medium">التسعير</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">السعر</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryFee">رسوم التوصيل</Label>
            <Input
              id="deliveryFee"
              type="number"
              min="0"
              step="0.01"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>المبلغ المطلوب عند التسليم</Label>
            <div className="h-10 px-3 py-2 rounded-md border bg-muted font-medium">
              {formatPrice(codAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="font-medium">التوصيل</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>نوع التوصيل</Label>
            <Select
              value={deliveryType}
              onValueChange={(v) => { if (v) setDeliveryType(v as "home" | "stop_desk"); }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">توصيل للمنزل</SelectItem>
                <SelectItem value="stop_desk">نقطة استلام</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">الوزن (كغ)</Label>
            <Input
              id="weight"
              type="number"
              min="0"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="fragile"
              checked={isFragile}
              onCheckedChange={setIsFragile}
            />
            <Label htmlFor="fragile">قابل للكسر</Label>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="font-medium">ملاحظات</h3>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="ملاحظات إضافية..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          <ArrowLeft className="w-4 h-4 me-2" />
          {common.cancel || "إلغاء"}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="w-4 h-4 me-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 me-2" />
          )}
          {common.save || "حفظ"}
        </Button>
      </div>
    </form>
  );
}
