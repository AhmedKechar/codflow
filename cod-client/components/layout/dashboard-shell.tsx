"use client";

import { SaveBarProvider } from "@/components/ui/save-bar-context";

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SaveBarProvider>{children}</SaveBarProvider>;
}
