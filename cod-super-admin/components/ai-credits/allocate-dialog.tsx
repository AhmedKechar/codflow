"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAiCredits } from "@/lib/translations";
import { allocateCreditsAction } from "@/actions/ai-credits";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: { id: string; name: string } | null;
}

export function AllocateDialog({ open, onOpenChange, store }: Props) {
  const t = useAiCredits();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(100);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!store || amount <= 0) return;

    startTransition(async () => {
      try {
        await allocateCreditsAction(store.id, amount);
        toast.success(t.allocated);
        router.refresh();
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
            <DialogTitle>{t.allocate}</DialogTitle>
            <DialogDescription>
              {store ? `${t.allocate_to} ${store.name}` : t.allocate}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 mt-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-muted-foreground">{t.amount}</Label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={isPending || amount <= 0}>
              {isPending ? "..." : t.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
