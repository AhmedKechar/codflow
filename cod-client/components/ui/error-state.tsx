"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useCommon } from "@/lib/translations";

interface ErrorStateProps {
  message: string;
  retry?: () => void;
  className?: string;
}

export function ErrorState({ message, retry, className }: ErrorStateProps) {
  const common = useCommon();
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <AlertCircle size={24} className="text-destructive" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">{common.error_occurred}</h3>
      <p className="text-[13px] text-muted-foreground mb-6 max-w-sm">{message}</p>
      {retry && (
        <Button onClick={retry} variant="outline">
          {common.retry}
        </Button>
      )}
    </div>
  );
}
