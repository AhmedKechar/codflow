"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, MoreHorizontal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
}

interface PageHeaderMoreAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  destructive?: boolean;
}

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  primaryAction?: PageHeaderAction;
  secondaryActions?: PageHeaderAction[];
  moreActions?: PageHeaderMoreAction[];
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  moreActions,
}: PageHeaderProps) {
  const resolvedTitle = title ?? (breadcrumbs && breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : "");
  const hasActions = primaryAction || (secondaryActions && secondaryActions.length > 0) || (moreActions && moreActions.length > 0);

  return (
    <div className="border-b border-border">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-2">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight className="w-3 h-3 shrink-0 rtl:rotate-180" />
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-4 py-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground leading-tight">
            {resolvedTitle}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        {hasActions && (
          <div className="flex items-center gap-2 shrink-0">
            {secondaryActions?.map((action, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className="h-8 px-3 text-xs hidden sm:inline-flex"
              >
                {action.loading ? (
                  <Loader2 size={12} className="animate-spin me-1" />
                ) : action.icon ? (
                  <span className="me-1">{action.icon}</span>
                ) : null}
                {action.label}
              </Button>
            ))}

            {moreActions && moreActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="h-8 w-8"
                    />
                  }
                >
                  <MoreHorizontal className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {moreActions.map((action, i) => (
                    <DropdownMenuItem
                      key={i}
                      onClick={action.onClick}
                      variant={action.destructive ? "destructive" : "default"}
                    >
                      {action.icon && (
                        <span className="me-1">{action.icon}</span>
                      )}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {primaryAction && (
              <Button
                size="sm"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
                variant={primaryAction.variant === "secondary" ? "outline" : "default"}
                className="h-8 px-4 text-xs"
              >
                {primaryAction.loading ? (
                  <Loader2 size={12} className="animate-spin me-1.5" />
                ) : primaryAction.icon ? (
                  <span className="me-1.5">{primaryAction.icon}</span>
                ) : null}
                {primaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
