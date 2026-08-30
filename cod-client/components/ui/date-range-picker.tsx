"use client";

import * as React from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const PRESETS = [
  { label: "آخر 7 أيام", labelEn: "Last 7 days", days: 7 },
  { label: "آخر 30 يوم", labelEn: "Last 30 days", days: 30 },
  { label: "آخر 90 يوم", labelEn: "Last 90 days", days: 90 },
  { label: "هذا الشهر", labelEn: "This month", days: 0 },
];

function getPresetDays(label: string): DateRange {
  const now = new Date();
  if (label.includes("7")) {
    return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
  }
  if (label.includes("30")) {
    return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
  }
  if (label.includes("90")) {
    return { from: startOfDay(subDays(now, 89)), to: endOfDay(now) };
  }
  return { from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: endOfDay(now) };
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "اختر التاريخ",
  className,
  disabled,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [fromDate, setFromDate] = React.useState<string>(
    value?.from ? format(value.from, "yyyy-MM-dd") : ""
  );
  const [toDate, setToDate] = React.useState<string>(
    value?.to ? format(value.to, "yyyy-MM-dd") : ""
  );

  React.useEffect(() => {
    setFromDate(value?.from ? format(value.from, "yyyy-MM-dd") : "");
    setToDate(value?.to ? format(value.to, "yyyy-MM-dd") : "");
  }, [value]);

  const handleApply = () => {
    if (fromDate && toDate) {
      onChange?.({
        from: startOfDay(new Date(fromDate)),
        to: endOfDay(new Date(toDate)),
      });
    } else if (fromDate) {
      onChange?.({
        from: startOfDay(new Date(fromDate)),
        to: endOfDay(new Date(fromDate)),
      });
    } else {
      onChange?.(undefined);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
    setFromDate("");
    setToDate("");
  };

  const handlePresetClick = (days: number) => {
    const now = new Date();
    let from: Date;
    if (days === 0) {
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    } else {
      from = startOfDay(subDays(now, days - 1));
    }
    setFromDate(format(from, "yyyy-MM-dd"));
    setToDate(format(now, "yyyy-MM-dd"));
  };

  const formatDateDisplay = () => {
    if (!value?.from) return placeholder;
    const fromStr = format(value.from, "dd MMM", { locale: ar });
    if (!value.to) return fromStr;
    const toStr = format(value.to, "dd MMM yyyy", { locale: ar });
    return `${fromStr} - ${toStr}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm text-foreground hover:border-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 dark:bg-input/20",
              className
            )}
          />
        }
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn("flex-1 text-left truncate", !value?.from && "text-muted-foreground")}>
          {formatDateDisplay()}
        </span>
        {value?.from && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded p-0.5 hover:bg-muted"
          >
            <XIcon className="size-3" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="flex flex-col gap-2 border-l p-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.labelEn}
                type="button"
                onClick={() => handlePresetClick(preset.days)}
                className="rounded-md px-3 py-1.5 text-sm text-start hover:bg-muted transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 p-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">من</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 rounded-lg border border-input bg-card px-3 text-sm dark:bg-input/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">إلى</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 rounded-lg border border-input bg-card px-3 text-sm dark:bg-input/20"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  onChange?.(undefined);
                  setOpen(false);
                }}
              >
                مسح
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1"
                onClick={handleApply}
              >
                تطبيق
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
