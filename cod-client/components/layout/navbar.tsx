"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, ExternalLink } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { useCommon } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface NavbarProps {
  storeDomain?: string | null;
}

export function Navbar({ storeDomain }: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const common = useCommon();

  useEffect(() => {
    setMounted(true);
  }, []);

  const storeUrl = storeDomain
    ? (storeDomain.startsWith("localhost") ? `http://${storeDomain}` : `https://${storeDomain}`)
    : null;

  if (!mounted) {
    return (
      <nav className="hidden md:flex items-center h-16 px-8 border-b border-border/40 bg-background/50 backdrop-blur-md z-20">
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-muted/20 animate-pulse" />
          <div className="w-9 h-9 rounded-xl bg-muted/20 animate-pulse" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="hidden md:flex items-center justify-end h-16 px-8 border-b border-border/30 bg-background/40 backdrop-blur-xl z-20 sticky top-0">
      <div className="flex items-center gap-3">
        {/* Visit Store Button */}
        {storeUrl && (
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-2 px-4 h-9 rounded-xl text-[13px] font-bold transition-all duration-300",
              "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground",
              "border border-primary/20 hover:border-primary hover:shadow-lg hover:shadow-primary/20",
              "active:scale-95"
            )}
          >
            <ExternalLink size={15} strokeWidth={2.5} />
            <span>{common.visit_store || "Visit Store"}</span>
          </a>
        )}

        <LanguageSwitcher />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-10 h-10 rounded-xl hover:bg-primary/5 hover:text-primary transition-all group"
        >
          <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 group-hover:rotate-12" />
          <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 group-hover:-rotate-12" />
          <span className="sr-only">{common.toggle_theme}</span>
        </Button>
      </div>
    </nav>
  );
}
