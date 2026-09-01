"use client";

import { useState } from "react";
import {
  Globe,
  MoreHorizontal,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Search,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useDomains } from "@/lib/translations";
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
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/components/ui/use-confirm";
import type { CustomDomain } from "@/actions/custom-domains";
import {
  deleteCustomDomainAction,
  verifyCustomDomainAction,
} from "@/actions/custom-domains";
import { toast } from "sonner";

interface DomainListProps {
  domains: CustomDomain[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onEdit?: (domain: CustomDomain) => void;
}

const STATUS_CONFIG: Record<
  string,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof Globe;
    key: string;
  }
> = {
  pending: { variant: "outline", icon: Clock, key: "pending" },
  verifying: { variant: "secondary", icon: RefreshCw, key: "verifying" },
  active: { variant: "default", icon: CheckCircle2, key: "active" },
  failed: { variant: "destructive", icon: XCircle, key: "failed" },
  expired: { variant: "outline", icon: ShieldAlert, key: "expired" },
};

const SSL_CONFIG: Record<
  string,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof ShieldCheck;
    key: string;
  }
> = {
  pending: { variant: "outline", icon: ShieldQuestion, key: "pending" },
  active: { variant: "default", icon: ShieldCheck, key: "active" },
  failed: { variant: "destructive", icon: ShieldAlert, key: "failed" },
};

export function DomainList({
  domains,
  isLoading,
  onRefresh,
  onEdit,
}: DomainListProps) {
  const t = useDomains();
  const { confirm, ConfirmDialog } = useConfirm();
  const [search, setSearch] = useState("");

  const handleVerify = async (id: string) => {
    const confirmed = await confirm({
      title: t.actions?.verify ?? "Verify Domain",
      description:
        t.actions?.verify_confirm ??
        "Are you sure you want to verify this domain?",
      variant: "default",
    });

    if (confirmed) {
      toast.info(t.toast?.verifying ?? "Verifying domain...");
      const result = await verifyCustomDomainAction(id);
      if (result.success) {
        toast.success(t.toast?.verified ?? "Domain verified successfully");
        onRefresh?.();
      } else {
        toast.error(
          result.error || (t.toast?.error ?? "Error occurred"),
        );
      }
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t.delete_dialog?.title ?? "Delete Domain",
      description:
        t.delete_dialog?.description ??
        "Are you sure you want to delete this domain?",
      confirmLabel: t.delete_dialog?.confirm ?? "Delete",
      cancelLabel: t.delete_dialog?.cancel ?? "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      const result = await deleteCustomDomainAction(id);
      if (result.success) {
        toast.success(t.toast?.deleted ?? "Domain deleted successfully");
        onRefresh?.();
      } else {
        toast.error(
          result.error || (t.toast?.error ?? "Error occurred"),
        );
      }
    }
  };

  const filteredDomains = domains.filter((d) => {
    if (!search) return true;
    return d.domain.toLowerCase().includes(search.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-muted/50" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-muted/50 rounded" />
                <div className="h-3 w-24 bg-muted/50 rounded" />
              </div>
              <div className="h-6 w-20 bg-muted/50 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <Globe
          size={48}
          className="mx-auto text-muted-foreground/30 mb-4"
        />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {t.empty?.title ?? "No custom domains"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t.empty?.description ??
            "Add your first custom domain to get started."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder={t.search_placeholder ?? "Search domains..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.table?.domain ?? "Domain"}</TableHead>
              <TableHead>{t.table?.status ?? "Status"}</TableHead>
              <TableHead>{t.table?.ssl ?? "SSL"}</TableHead>
              <TableHead>{t.table?.added ?? "Added"}</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDomains.map((domain) => {
              const statusConfig =
                STATUS_CONFIG[domain.status] ?? STATUS_CONFIG.pending;
              const sslConfig =
                SSL_CONFIG[domain.sslStatus] ?? SSL_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const SslIcon = sslConfig.icon;
              const statusLabel =
                t.status?.[statusConfig.key as keyof typeof t.status] ??
                statusConfig.key;
              const sslLabel =
                t.ssl?.[sslConfig.key as keyof typeof t.ssl] ?? sslConfig.key;

              return (
                <TableRow key={domain.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center">
                        <Globe size={14} className="text-muted-foreground" />
                      </div>
                      <span className="font-mono font-medium text-sm">
                        {domain.domain}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig.variant}>
                      <StatusIcon size={12} className="mr-1" />
                      {statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sslConfig.variant}>
                      <SslIcon size={12} className="mr-1" />
                      {sslLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(domain.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          />
                        }
                      >
                        <MoreHorizontal size={16} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {domain.status !== "active" && (
                          <DropdownMenuItem
                            onClick={() => handleVerify(domain.id)}
                          >
                            <ShieldCheck size={14} className="mr-2" />
                            {t.actions?.verify ?? "Verify"}
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem
                            onClick={() => onEdit(domain)}
                          >
                            <RefreshCw size={14} className="mr-2" />
                            {t.actions?.edit ?? "Edit"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(domain.id)}
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
