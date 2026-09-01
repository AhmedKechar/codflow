"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrackingTimeline } from "@/components/orders/tracking-timeline";
import { useOrders } from "@/lib/translations";

interface TrackingPageProps {
  params: Promise<{ id: string }>;
}

export default function TrackingPage({ params }: TrackingPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const t = useOrders();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/orders/${id}`)}
          className="gap-2"
        >
          <ArrowRight size={16} />
          العودة للطلب
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package size={18} />
            تتبع الشحن
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrackingTimeline orderId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
