"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n-context";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Returns the page number sequence to render, inserting "…" where needed. */
function getPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3)
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  const { dir } = useLanguage();

  if (totalPages <= 1) return null;

  const pages = getPageRange(currentPage, totalPages);
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  // In RTL the arrow directions are mirrored
  const PrevIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  const navBtn = cn(
    "w-9 h-9 rounded-md flex items-center justify-center",
    "transition-colors duration-150",
    "bg-card border border-border text-muted-foreground",
    "hover:bg-muted hover:text-foreground",
    "disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed",
  );

  return (
    <div className={cn("flex flex-col items-center gap-3 pt-2", className)}>
      {/* Range info */}
      <p className="text-xs text-muted-foreground tabular-nums">
        {from}–{to} / {totalItems}
      </p>

      {/* Page controls — always LTR so numbers read left-to-right */}
      <div className="flex items-center gap-1.5" dir="ltr">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={navBtn}
          aria-label="Previous page"
        >
          <PrevIcon size={15} />
        </button>

        {/* Page numbers */}
        {pages.map((page, i) =>
          page === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="w-9 h-9 flex items-center justify-center text-xs text-muted-foreground select-none"
            >
              ···
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              aria-current={page === currentPage ? "page" : undefined}
              className={cn(
                "w-9 h-9 rounded-md flex items-center justify-center text-sm",
                "transition-colors duration-150",
                page === currentPage
                  ? "bg-primary text-primary-foreground"
                  : cn(
                      "bg-card border border-border text-muted-foreground",
                      "hover:bg-muted hover:text-foreground",
                    ),
              )}
            >
              {page}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={navBtn}
          aria-label="Next page"
        >
          <NextIcon size={15} />
        </button>
      </div>
    </div>
  );
}