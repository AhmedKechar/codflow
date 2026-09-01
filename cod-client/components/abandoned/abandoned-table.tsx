"use client";

import { useState } from "react";
import { Phone, MapPin, Package, MoreHorizontal, Trash2, Mail, CheckCircle } from "lucide-react";
import { useAbandonedOrders } from "@/lib/translations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/components/ui/use-confirm";
import type { AbandonedOrder } from "@/actions/abandoned-orders";
import {
  updateAbandonedOrderStatusAction,
  deleteAbandonedOrderAction,
} from "@/actions/abandoned-orders";
import { toast } from "sonner";

interface AbandonedTableProps {
  orders: AbandonedOrder[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const STATUS_CONFIG: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline"; key: string }
> = {
  pending: { variant: "outline", key: "pending" },
  abandoned: { variant: "destructive", key: "abandoned" },
  contacted: { variant: "secondary", key: "contacted" },
  converted: { variant: "default", key: "converted" },
};

export function AbandonedTable({ orders, isLoading, onRefresh }: AbandonedTableProps) {
  const t = useAbandonedOrders();
  const { confirm, ConfirmDialog } = useConfirm();

  const handleStatusUpdate = async (id: string, status: string) => {
    const result = await updateAbandonedOrderStatusAction(
      id,
      status as "pending" | "abandoned" | "contacted" | "converted"
    );
    if (result.success) {
      toast.success(t.toast?.status_updated ?? "Status updated");
      onRefresh?.();
    } else {
      toast.error(result.error || (t.toast?.error ?? "Error occurred"));
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t.delete_dialog?.title ?? "Delete Order",
      description: t.delete_dialog?.description ?? "Are you sure you want to delete this order?",
      confirmLabel: t.delete_dialog?.confirm ?? "Delete",
      cancelLabel: t.delete_dialog?.cancel ?? "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      const result = await deleteAbandonedOrderAction(id);
      if (result.success) {
        toast.success(t.toast?.deleted ?? "Order deleted");
        onRefresh?.();
      } else {
        toast.error(result.error || (t.toast?.error ?? "Error occurred"));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-muted/50" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted/50 rounded" />
                <div className="h-3 w-24 bg-muted/50 rounded" />
              </div>
              <div className="h-6 w-20 bg-muted/50 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Package size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {t.empty?.title ?? "No abandoned orders"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t.empty?.description ?? "Orders abandoned by customers will appear here."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.table?.customer ?? "Customer"}</TableHead>
              <TableHead>{t.table?.phone ?? "Phone"}</TableHead>
              <TableHead>{t.table?.location ?? "Location"}</TableHead>
              <TableHead>{t.table?.product ?? "Product"}</TableHead>
              <TableHead>{t.table?.price ?? "Price"}</TableHead>
              <TableHead>{t.table?.status ?? "Status"}</TableHead>
              <TableHead>{t.table?.date ?? "Date"}</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
              const statusLabel = t.status?.[statusConfig.key as keyof typeof t.status] ?? statusConfig.key;
              return (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {order.customerName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{order.customerName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone size={14} />
                      <span dir="ltr">{order.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <MapPin size={14} />
                      <span>
                        {order.communeName || order.wilayaName || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{order.productName || "—"}</span>
                      {order.variantLabel && (
                        <span className="text-muted-foreground ml-1">
                          ({order.variantLabel})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      {order.price ? `${order.price.toLocaleString()} دج` : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig.variant}>
                      {statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("ar-DZ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal size={16} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {order.status === "abandoned" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(order.id, "contacted")}
                          >
                            <Mail size={14} className="mr-2" />
                            {t.actions?.mark_contacted ?? "Mark Contacted"}
                          </DropdownMenuItem>
                        )}
                        {order.status !== "converted" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(order.id, "converted")}
                          >
                            <CheckCircle size={14} className="mr-2" />
                            {t.actions?.mark_converted ?? "Mark Converted"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(order.id)}
                          className="text-destructive"
                        >
                          <Trash2 size={14} className="mr-2" />
                          {t.actions?.delete ?? "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {ConfirmDialog}
    </>
  );
}
