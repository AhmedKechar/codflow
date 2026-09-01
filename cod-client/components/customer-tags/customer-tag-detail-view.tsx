"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, UserPlus, UserMinus, Users, Search } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCustomerTags, useCommon } from "@/lib/translations";
import { useConfirm } from "@/components/ui/use-confirm";
import { assignCustomerTag, unassignCustomerTag, deleteCustomerTag } from "@/actions/customer-tags";
import { ProtectedAction } from "@/components/rbac/ProtectedAction";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import { formatDate } from "@/lib/format";
import { generateAvatar } from "@/lib/avatar";
import type { CustomerTagWithCustomers, CustomerTagAssigned, Customer } from "@/types";
import { PageHeader } from "@/components/ui/page-header";

interface Props {
  tag: CustomerTagWithCustomers;
  allCustomers: Customer[];
  userScopes: string[];
}

export function CustomerTagDetailView({ tag, allCustomers, userScopes }: Props) {
  const t = useCustomerTags();
  const common = useCommon();
  const router = useRouter();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();

  const [search, setSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const assignedIds = new Set(tag.customers.map((c) => c.id));

  const filteredCustomers = tag.customers.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search),
  );

  const available = allCustomers.filter(
    (c) =>
      !assignedIds.has(c.id) &&
      (!addSearch || c.name.toLowerCase().includes(addSearch.toLowerCase()) || c.phone.includes(addSearch)),
  );

  async function handleAssign(customer: Customer) {
    setActionLoading(`add-${customer.id}`);
    try {
      await assignCustomerTag(tag.id, customer.id);
      toast.success(t.detail.customer_added);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign tag");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnassign(customer: CustomerTagAssigned) {
    const ok = await confirmDialog({
      title: common.confirm_delete_title?.replace("{name}", customer.name) ?? customer.name,
      variant: "destructive",
      confirmLabel: t.detail.remove_customer,
    });
    if (!ok) return;

    setActionLoading(`remove-${customer.id}`);
    try {
      await unassignCustomerTag(tag.id, customer.id);
      toast.success(t.detail.customer_removed);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unassign tag");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    const ok = await confirmDialog({
      title: common.confirm_delete_title?.replace("{name}", tag.name) ?? tag.name,
      variant: "destructive",
      confirmLabel: common.delete,
    });
    if (!ok) return;
    try {
      await deleteCustomerTag(tag.id);
      toast.success(t.success_deleted);
      router.push("/customer-tags");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.error_delete_failed);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in">
      <PageHeader
        breadcrumbs={[
          { label: "Customer Tags", href: "/customer-tags" },
          { label: tag.name },
        ]}
        secondaryActions={[
          {
            label: t.actions.edit,
            onClick: () => router.push(`/customer-tags/${tag.id}/edit`),
            icon: <Edit className="w-3.5 h-3.5" />,
          },
        ]}
        moreActions={[
          {
            label: t.actions.delete,
            onClick: handleDelete,
            icon: <Trash2 className="w-3.5 h-3.5" />,
            destructive: true,
          },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg p-4 space-y-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{t.table.customers}</p>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground/60" />
            <span className="text-2xl font-black text-foreground tabular-nums">{tag.assignmentCount}</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 space-y-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{t.table.created}</p>
          <p className="text-sm font-black text-foreground">{formatDate(tag.createdAt)}</p>
        </div>
      </div>

      {/* Customers section */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground/60" />
            <span className="text-sm font-black uppercase tracking-widest text-foreground/70">{t.detail.customers}</span>
            <span className="text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{tag.customers.length}</span>
          </div>
          <ProtectedAction userScopes={userScopes} requiredScope={SCOPES.CUSTOMER_TAGS_MANAGE}>
            <Button size="sm" onClick={() => setShowAddPanel(!showAddPanel)} className="h-8 rounded-md bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest gap-1.5 px-3">
              <UserPlus className="w-3 h-3" />{t.detail.add_customer}
            </Button>
          </ProtectedAction>
        </div>

        {showAddPanel && (
          <div className="px-5 py-4 border-b border-border/20 space-y-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
              <input value={addSearch} onChange={(e) => setAddSearch(e.target.value)} placeholder={t.detail.search_add} className="w-full h-9 ps-9 pe-3 rounded-md bg-card border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all" />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {available.length === 0 ? (
                <p className="text-xs font-bold text-muted-foreground/50 py-2 text-center">{t.detail.no_available}</p>
              ) : (
                available.slice(0, 20).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0" style={{ backgroundColor: generateAvatar(customer.name, customer.id).color }}>{generateAvatar(customer.name, customer.id).initials}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{customer.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground/60" dir="ltr">{customer.phone}</p>
                      </div>
                    </div>
                    <button onClick={() => handleAssign(customer)} disabled={actionLoading === `add-${customer.id}`} className="w-7 h-7 rounded-md bg-muted text-muted-foreground hover:bg-accent flex items-center justify-center transition-colors active:scale-90 shrink-0">
                      <UserPlus className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tag.customers.length > 5 && (
          <div className="px-5 py-3 border-b border-border/20">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.detail.search_customers} className="w-full h-9 ps-9 pe-3 rounded-md bg-card border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all" />
            </div>
          </div>
        )}

        <div className="divide-y divide-border/10">
          {filteredCustomers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm font-bold text-muted-foreground/40">{t.detail.no_customers}</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white shrink-0" style={{ backgroundColor: generateAvatar(customer.name, customer.id).color }}>{generateAvatar(customer.name, customer.id).initials}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-foreground truncate">{customer.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground/60 mt-0.5" dir="ltr">{customer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-end hidden sm:block">
                    <p className="text-xs font-black text-foreground tabular-nums">{formatPrice(customer.totalSpent)}</p>
                    <p className="text-[10px] font-bold text-muted-foreground/50">{customer.totalOrders} {t.detail.orders_label}</p>
                  </div>
                  <ProtectedAction userScopes={userScopes} requiredScope={SCOPES.CUSTOMER_TAGS_MANAGE}>
                    <button onClick={() => handleUnassign(customer)} disabled={actionLoading === `remove-${customer.id}`} className="w-8 h-8 rounded-md bg-destructive/5 hover:bg-destructive/10 text-destructive/60 hover:text-destructive flex items-center justify-center transition-colors active:scale-90">
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </ProtectedAction>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {ConfirmDialog}
    </div>
  );
}
