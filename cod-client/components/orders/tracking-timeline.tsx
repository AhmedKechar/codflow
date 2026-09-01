"use client";

import { useState, useEffect } from "react";
import { RefreshCw, MapPin, Clock, Package, Truck, CheckCircle, RotateCcw, AlertCircle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getShipmentTracking } from "@/actions/orders";
import { cn } from "@/lib/utils";

interface TrackingEvent {
  activity: string;
  description?: string;
  date?: string;
  location?: string;
  status?: string;
}

const CARRIER_STATUS_CONFIG: Record<string, { icon: typeof Package; color: string; label: string }> = {
  received: { icon: Package, color: "text-blue-500", label: "تم الاستلام" },
  in_transit: { icon: Truck, color: "text-amber-500", label: "في الطريق" },
  at_office: { icon: MapPin, color: "text-purple-500", label: "في المكتب" },
  with_driver: { icon: Truck, color: "text-orange-500", label: "مع السائق" },
  delivered: { icon: CheckCircle, color: "text-green-500", label: "تم التسليم" },
  returned: { icon: RotateCcw, color: "text-red-500", label: "مرتجع" },
};

function getStatusIcon(status?: string) {
  if (!status) return { icon: Package, color: "text-muted-foreground" };
  const config = CARRIER_STATUS_CONFIG[status];
  if (config) return { icon: config.icon, color: config.color };
  return { icon: AlertCircle, color: "text-muted-foreground" };
}

function TrackingEventItem({ event, isLast }: { event: TrackingEvent; isLast: boolean }) {
  const { icon: Icon, color } = getStatusIcon(event.status);

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isLast ? "bg-primary/10" : "bg-muted"
        )}>
          <Icon size={14} className={isLast ? "text-primary" : color} />
        </div>
        {!isLast && <div className="w-px h-full bg-border/50 my-1" />}
      </div>

      <div className={cn("flex-1 pb-6", isLast && "pb-0")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn(
              "text-sm font-medium",
              isLast ? "text-foreground" : "text-muted-foreground"
            )}>
              {event.activity}
            </p>
            {event.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
            )}
            {event.location && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={10} className="text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground/70">{event.location}</span>
              </div>
            )}
          </div>
          {event.date && (
            <span className="text-xs text-muted-foreground/70 tabular-nums whitespace-nowrap shrink-0">
              {event.date}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TrackingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface TrackingTimelineProps {
  orderId: string;
  showRefresh?: boolean;
}

export function TrackingTimeline({ orderId, showRefresh = true }: TrackingTimelineProps) {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [source, setSource] = useState<"cache" | "live">("cache");

  // Fetch cached tracking events from DB
  async function fetchCachedTracking() {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/carrier-tracking`);
      const data = await response.json() as { success: boolean; data: Array<{ status: string; statusRaw: string | null; statusAr: string | null; eventTime: string; location: string | null }> };
      if (data.success && Array.isArray(data.data)) {
        // Map DB events to TrackingEvent format
        const mapped: TrackingEvent[] = data.data.map((e) => ({
          activity: e.statusAr ?? e.statusRaw ?? e.status,
          description: e.statusRaw ?? undefined,
          date: e.eventTime,
          location: e.location ?? undefined,
          status: e.status,
        }));
        setEvents(mapped);
        setSource("cache");
      }
    } catch {
      // Fallback to live tracking
      await fetchLiveTracking();
    } finally {
      setLoading(false);
    }
  }

  // Fetch live tracking from carrier API
  async function fetchLiveTracking() {
    setRefreshing(true);
    try {
      const result = await getShipmentTracking(orderId);
      setEvents(result);
      setSource("live");
      if (result.length > 0) {
        toast.success("تم تحديث التتبع من الشركة");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ في جلب التتبع");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCachedTracking();
  }, [orderId]);

  if (loading) return <TrackingSkeleton />;

  return (
    <div className="space-y-4">
      {showRefresh && (
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs gap-1">
            <Database size={10} />
            {source === "cache" ? "من القاعدة" : "مباشر من الشركة"}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchLiveTracking()}
            disabled={refreshing}
            className="gap-2 text-xs"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            تحديث من الشركة
          </Button>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12">
          <Package size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">لا توجد أحداث تتبع بعد</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            سيتم عرض تحديثات التتبع هنا عند توفرها
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {events.map((event, i) => (
            <TrackingEventItem
              key={i}
              event={event}
              isLast={i === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
