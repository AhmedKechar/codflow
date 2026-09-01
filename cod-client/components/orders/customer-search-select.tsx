"use client";

import { useState, useMemo } from "react";
import { X, Search, UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox, ComboboxContent, ComboboxTrigger } from "@/components/ui/combobox";
import { Customer } from "@/types";
import { useOrders } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface Props {
  customers: Customer[];
  onSelect: (customer: Customer) => void;
  selectedCustomer: Customer | null;
  onClear: () => void;
  mode: "existing" | "new";
  onModeChange: (mode: "existing" | "new") => void;
}

export function CustomerSearchSelect({
  customers,
  onSelect,
  selectedCustomer,
  onClear,
  mode,
  onModeChange,
}: Props) {
  const t = useOrders();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.wilaya && c.wilaya.toLowerCase().includes(q))
    );
  }, [customers, search]);

  function handleSelect(customer: Customer) {
    onSelect(customer);
    setSearch("");
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "existing" ? "default" : "outline"}
          size="sm"
          onClick={() => onModeChange("existing")}
          className={cn(
            "h-8 text-xs font-bold",
            mode === "existing" && "bg-primary text-primary-foreground"
          )}
        >
          <UserCheck size={12} className="me-1" />
          {t.form.existing_customer}
        </Button>
        <Button
          type="button"
          variant={mode === "new" ? "default" : "outline"}
          size="sm"
          onClick={() => onModeChange("new")}
          className={cn(
            "h-8 text-xs font-bold",
            mode === "new" && "bg-primary text-primary-foreground"
          )}
        >
          <UserPlus size={12} className="me-1" />
          {t.form.add_new_customer}
        </Button>
      </div>

      {/* Search Combobox (existing mode) */}
      {mode === "existing" && (
        <div className="flex gap-2">
          {selectedCustomer ? (
            <div className="flex-1 flex items-center gap-2 h-11 px-4 rounded-lg border border-primary/30 bg-primary/5">
              <UserCheck size={14} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{selectedCustomer.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {selectedCustomer.phone} · {selectedCustomer.wilaya}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </Button>
            </div>
          ) : (
            <Combobox open={open} onOpenChange={setOpen}>
              <ComboboxTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      "flex h-11 flex-1 items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none outline-none box-border shrink-0"
                    )}
                  />
                }
              >
                <span className="text-muted-foreground">{t.form.search_customers}</span>
                <Search size={14} className="shrink-0 text-muted-foreground" />
              </ComboboxTrigger>
              <ComboboxContent className="p-0">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t.form.search_customers}
                      className="h-9 ps-9 text-sm"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-1">
                  {filtered.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {t.form.no_customers_found}
                    </p>
                  ) : (
                    filtered.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleSelect(customer)}
                        className="w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-start hover:bg-muted transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {customer.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate">{customer.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {customer.phone} · {customer.wilaya}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ComboboxContent>
            </Combobox>
          )}
        </div>
      )}
    </div>
  );
}
