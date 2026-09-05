"use client";

import { useState, useTransition } from "react";
import { Search, Trash2, Shield, ShieldOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getBlockedIps, blockIp, unblockIp, type BlockedIp } from "@/actions/blocked-ips";
import { useConfirm } from "@/components/ui/use-confirm";

interface BlockedIPsTableProps {
  initialData: BlockedIp[];
  total: number;
}

export function BlockedIPsTable({ initialData, total: initialTotal }: BlockedIPsTableProps) {
  const [data, setData] = useState<BlockedIp[]>(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");
  const { confirm, ConfirmDialog } = useConfirm();

  function handleSearch() {
    startTransition(async () => {
      const result = await getBlockedIps({ search, limit: 50 });
      setData(result.data);
      setTotal(result.total);
    });
  }

  function handleAdd() {
    if (!newIp.trim()) return;

    startTransition(async () => {
      try {
        await blockIp(newIp.trim(), { reason: newReason.trim() || undefined });
        toast.success("تم حظر العنوان بنجاح");
        setAddDialogOpen(false);
        setNewIp("");
        setNewReason("");
        // Refresh list
        const result = await getBlockedIps({ search, limit: 50 });
        setData(result.data);
        setTotal(result.total);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "خطأ في حظر العنوان");
      }
    });
  }

  async function handleUnblock(item: BlockedIp) {
    const confirmed = await confirm({
      title: "فك الحظر",
      description: `هل أنت متأكد من فك حظر العنوان ${item.ipAddress}؟`,
    });

    if (!confirmed) return;

    startTransition(async () => {
      try {
        await unblockIp(item.id);
        toast.success("تم فك الحظر بنجاح");
        setData((prev) => prev.filter((d) => d.id !== item.id));
        setTotal((prev) => prev - 1);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "خطأ في فك الحظر");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث عن IP..."
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} variant="outline" disabled={isPending}>
          بحث
        </Button>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <Plus size={14} />
          حظر IP
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {total} عنوان محظور
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>العنوان</TableHead>
              <TableHead>السبب</TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead>تاريخ الانتهاء</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  لا توجد عناوين محظورة
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">{item.ipAddress}</TableCell>
                  <TableCell>{item.reason ?? "—"}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString("ar-DZ")}</TableCell>
                  <TableCell>
                    {item.expiresAt
                      ? new Date(item.expiresAt).toLocaleDateString("ar-DZ")
                      : "permanent"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnblock(item)}
                      disabled={isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <ShieldOff size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield size={18} />
              حظر عنوان IP
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">عنوان IP</label>
              <Input
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="192.168.1.1"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">السبب (اختياري)</label>
              <Input
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="طلب مزيف..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAdd} disabled={!newIp.trim() || isPending}>
              حظر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
