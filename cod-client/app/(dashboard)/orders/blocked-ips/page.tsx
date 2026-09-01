"use client";

import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlockedIPsTable } from "@/components/orders/blocked-ips-table";
import type { BlockedIp } from "@/actions/blocked-ips";
import { use } from "react";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default function BlockedIPsPage({ searchParams }: PageProps) {
  const params = use(searchParams);
  // For now, we load initial data on the client side
  // A production version would use server components for initial load
  const initialData: BlockedIp[] = [];
  const total = 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={18} />
            إدارة IPs المحظورة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BlockedIPsTable initialData={initialData} total={total} />
        </CardContent>
      </Card>
    </div>
  );
}
