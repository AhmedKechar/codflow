"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowUpRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBilling } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface Props {
  subscription: any;
}

export function TrialBanner({ subscription }: Props) {
  const t = useBilling();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const isTrial = subscription?.status === "trialing";
  const endsAt = subscription?.endsAt;

  if (!isTrial || dismissed || !endsAt) return null;

  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 animate-fade-in">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 shrink-0 text-amber-600" />
        <p className="text-sm font-bold">
          متبقي <span className="font-black">{daysRemaining}</span> أيام من
          الفترة التجريبية المجانية
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="xs"
          className="bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
          onClick={() => router.push("/billing/upgrade")}
        >
          <ArrowUpRight className="w-3 h-3 me-1" />
          {t.upgrade_now}
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg hover:bg-amber-100 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-amber-600" />
        </button>
      </div>
    </div>
  );
}
