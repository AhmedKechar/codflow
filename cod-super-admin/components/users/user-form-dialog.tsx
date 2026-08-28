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
import { useUsers } from "@/lib/translations";
import { createUserAction, updateUserAction } from "@/actions/users";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff" | "super_admin";
  status: "active" | "inactive";
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserRow | null;
}

export function UserFormDialog({ open, onOpenChange, user }: Props) {
  const t = useUsers();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "staff">(user?.role === "super_admin" ? "admin" : (user?.role ?? "staff"));
  const [status, setStatus] = useState<"active" | "inactive">(user?.status ?? "active");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (user) {
          await updateUserAction(user.id, { name, email, role, status });
          toast.success(t.updated);
        } else {
          if (!password) {
            toast.error(t.error);
            return;
          }
          await createUserAction({ name, email, password, role, status });
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
            <DialogTitle>{user ? t.edit : t.create}</DialogTitle>
            <DialogDescription>{`${user ? t.edit : t.create} ${t.title}`}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 mt-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-muted-foreground">{t.name}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-muted-foreground">{t.email}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {!user && (
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-muted-foreground">{t.password}</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-muted-foreground">{t.role}</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "admin" | "staff")}>
                <SelectTrigger>
                  <SelectValue>{role === "admin" ? t.admin : t.staff}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t.admin}</SelectItem>
                  <SelectItem value="staff">{t.staff}</SelectItem>
                </SelectContent>
              </Select>
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
