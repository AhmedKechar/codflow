"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

export function FormSection({
  title,
  subtitle,
  icon,
  children,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-border bg-card overflow-hidden ${className ?? ""}`}>
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/60 bg-muted/20">
        {icon && (
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            <div className="text-muted-foreground">{icon}</div>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function FormField({
  label,
  children,
  className,
  error,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  error?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label className="text-sm font-medium text-foreground ms-1">{label}</Label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive mt-1 ms-1 font-medium">
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  );
}
