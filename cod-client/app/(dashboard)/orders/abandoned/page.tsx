"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { useAbandonedOrders } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { AbandonedStats } from "@/components/abandoned/abandoned-stats";
import { AbandonedFilters } from "@/components/abandoned/abandoned-filters";
import { AbandonedTable } from "@/components/abandoned/abandoned-table";
import {
  getAbandonedOrders,
  getAbandonedOrderStatsAction,
  type AbandonedOrder,
  type AbandonedOrderStats,
} from "@/actions/abandoned-orders";

export default function AbandonedOrdersPage() {
  const t = useAbandonedOrders();
  const [orders, setOrders] = useState<AbandonedOrder[]>([]);
  const [stats, setStats] = useState<AbandonedOrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ordersResult, statsResult] = await Promise.all([
        getAbandonedOrders({
          search: search || undefined,
          status: status === "all" ? undefined : (status as any),
        }),
        getAbandonedOrderStatsAction(),
      ]);
      setOrders(ordersResult.rows);
      setStats(statsResult);
    } catch (error) {
      console.error("Failed to fetch abandoned orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t.page_title ?? "Abandoned Orders"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.page_subtitle ?? "Track and manage abandoned orders"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={isLoading}
        >
          <RefreshCw
            size={16}
            className={isLoading ? "animate-spin" : ""}
          />
        </Button>
      </div>

      <AbandonedStats stats={stats} isLoading={isLoading} />

      <AbandonedFilters
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      <AbandonedTable
        orders={orders}
        isLoading={isLoading}
        onRefresh={fetchData}
      />
    </div>
  );
}
