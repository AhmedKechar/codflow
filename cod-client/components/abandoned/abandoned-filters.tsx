"use client";

import { Search, X } from "lucide-react";
import { useAbandonedOrders } from "@/lib/translations";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AbandonedFiltersProps {
  search: string;
  status: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function AbandonedFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: AbandonedFiltersProps) {
  const t = useAbandonedOrders();

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder={t.search_placeholder ?? "Search..."}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <Select value={status} onValueChange={(v) => onStatusChange(v ?? "all")}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={t.filters?.status ?? "Status"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t.status?.all ?? "All"}
          </SelectItem>
          <SelectItem value="abandoned">
            {t.status?.abandoned ?? "Abandoned"}
          </SelectItem>
          <SelectItem value="contacted">
            {t.status?.contacted ?? "Contacted"}
          </SelectItem>
          <SelectItem value="converted">
            {t.status?.converted ?? "Converted"}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
