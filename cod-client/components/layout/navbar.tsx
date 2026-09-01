"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, ChevronDown, LogOut, User, Settings, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { useCommon } from "@/lib/translations";
import { useSaveBar } from "@/components/ui/save-bar-context";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface NavbarProps {
  storeDomain?: string | null;
  user?: { name: string; initials: string; role: string };
  onSignOut?: () => Promise<void>;
}

export function Navbar({ storeDomain, user, onSignOut }: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const common = useCommon();
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");
  const saveBar = useSaveBar();

  useEffect(() => {
    setMounted(true);
    setDir(document.documentElement.dir === "rtl" ? "rtl" : "ltr");
  }, []);

  const isRtl = dir === "rtl";
  const bar = saveBar?.active ?? null;

  return (
    <nav className="hidden md:flex items-center h-14 px-4 md:px-6 bg-foreground text-background z-20 sticky top-0 w-full">
      {/* Center — save bar message + actions */}
      <div className="flex-1 flex items-center justify-center">
        {bar ? (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={bar.onCancel}
              disabled={bar.isSaving}
              className="h-8 px-3 text-xs text-background/70 hover:text-background hover:bg-background/10"
            >
              {common.cancel ?? "Cancel"}
            </Button>
            <p className="text-[13px] text-background/70 font-medium">
              {bar.isSaving
                ? (common.saving ?? "Saving...")
                : (common.unsaved_changes ?? "You have unsaved changes")}
            </p>
            <Button
              size="sm"
              onClick={bar.onSave}
              disabled={bar.isSaving}
              className="h-8 px-4 text-xs bg-background text-foreground hover:bg-background/90"
            >
              {bar.isSaving ? (
                <Loader2 size={12} className="animate-spin me-1.5" />
              ) : null}
              {bar.isSaving ? (common.saving ?? "Saving...") : (common.save ?? "Save")}
            </Button>
          </div>
        ) : null}
      </div>

      {/* Right side — language + theme + user */}
      <div className="flex items-center gap-3 shrink-0">
        <LanguageSwitcher />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-10 h-10 rounded-md hover:bg-background/10 text-background transition-colors"
        >
          <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{common.toggle_theme}</span>
        </Button>

        {user && (
          <Popover>
            <PopoverTrigger
              render={
                <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-background/10 transition-colors cursor-pointer" />
              }
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-background/15 flex items-center justify-center text-[11px] font-semibold text-background">
                  {user.initials}
                </div>
              </div>
              <ChevronDown size={14} className="text-background/60 shrink-0" />
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              sideOffset={8}
              align={isRtl ? "start" : "end"}
              className="w-56 p-1.5"
            >
              <div className="space-y-0.5">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-foreground truncate leading-tight">{user.name}</p>
                  <p className="text-muted-foreground text-[11px] font-medium truncate mt-0.5">
                    {user.role ? (common.roles as any)[user.role] || user.role : ""}
                  </p>
                </div>
                <div className="h-px bg-border my-1" />
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <User size={16} className="text-muted-foreground" />
                  <span>{(common as any).profile || "Profile"}</span>
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Settings size={16} className="text-muted-foreground" />
                  <span>{(common as any).settings || "Settings"}</span>
                </Link>
                <div className="h-px bg-border my-1" />
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>{(common as any).sign_out || "Sign out"}</span>
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </nav>
  );
}
