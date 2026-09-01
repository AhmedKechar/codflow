"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface FormHeaderProps {
  backHref: string;
  title: string;
}

export function FormHeader({ backHref, title }: FormHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href={backHref}
        className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
    </div>
  );
}
