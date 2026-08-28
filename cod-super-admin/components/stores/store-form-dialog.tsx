"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStores } from "@/lib/translations";
import { createStoreAction, updateStoreAction } from "@/actions/stores";

type StoreRow = {
  id: string;
  name: string;
  domain: string | null;
  status: "active" | "inactive";
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store?: StoreRow | null;
}

export function StoreFormDialog({ open, onOpenChange, store }: Props) {
  const t = useStores();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(store?.name ?? "");
  const [domain, setDomain] = useState(store?.domain ?? "");
  const [status, setStatus] = useState<"active" | "inactive">(store?.status ?? "active");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (store) {
          await updateStoreAction(store.id, { name, domain: domain || undefined, status });
          toast.success(t.updated);
        } else {
          await createStoreAction({ name, domain: domain || undefined, status });
          toast.success(t.created);
        }
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{store ? t.edit : t.create}</DialogTitle>
            <DialogDescription>{`${store ? t.edit : t.create} ${t.title}`}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 mt-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-muted-foreground">{t.name}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-muted-foreground">{t.domain}</Label>
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-muted-foreground">{t.status}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
                <SelectTrigger>
                  <SelectValue>{status === "active" ? t.active : t.inactive}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t.active}</SelectItem>
                  <SelectItem value="inactive">{t.inactive}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "..." : t.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
