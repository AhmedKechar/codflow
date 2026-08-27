"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Crown,
  CreditCard,
  Store,
  Users,
  KeyRound,
  Shield,
  Command,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useNavigation, useCommon } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";

interface SidebarUser {
  name: string;
  initials: string;
  role: string;
}

interface SidebarProps {
  user: SidebarUser;
  onSignOut?: () => Promise<void>;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

export function Sidebar({ user, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { dir } = useLanguage();
  const nav = useNavigation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems: NavItem[] = [
    { href: "/dashboard", label: nav.dashboard, icon: LayoutDashboard },
    { href: "/plans", label: nav.plans, icon: Crown },
    { href: "/payments", label: nav.payments, icon: CreditCard },
    { href: "/stores", label: nav.stores, icon: Store },
    { href: "/users", label: nav.users, icon: Users },
    { href: "/provider-keys", label: nav.provider_keys, icon: KeyRound },
  ];

  return (
    <aside
      className="hidden md:flex flex-col w-[280px] transition-all duration-500 shrink-0 border-e relative overflow-hidden bg-sidebar/80 backdrop-blur-xl border-sidebar-border/40 shadow-[1px_0_0_0_rgba(0,0,0,0.02)]"
    >
      <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[40%] bg-primary/10 blur-[120px] pointer-events-none animate-pulse duration-[10000ms]" />
      <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[40%] bg-primary/5 blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />

      <div className="flex items-center gap-3 h-[80px] relative z-20 transition-all duration-500 px-6">
        <div className="flex items-center gap-3 w-full p-2.5 rounded-[1.25rem] transition-all duration-500 group/logo bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-premium backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 transition-all duration-500 group-hover/logo:scale-110 group-hover/logo:rotate-3 relative z-10 overflow-hidden">
            <Command className="text-primary-foreground size-5" />
          </div>
          <div className="overflow-hidden text-start animate-fade-in space-y-0.5">
            <p className="font-black text-[15px] leading-none text-foreground tracking-tight truncate">
              CodFlow Platform
            </p>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.1em]">
              Super Admin
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-4 overflow-y-auto scrollbar-none relative z-10">
        <div className="space-y-1.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            const itemClass = cn(
              "w-full group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[14px] transition-all duration-300 relative cursor-pointer",
              isActive
                ? "bg-white dark:bg-white/5 text-primary font-bold shadow-premium border border-primary/10"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5"
            );

            return (
              <Link key={item.href} href={item.href} className={itemClass}>
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                      : "bg-muted/30 group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-110"
                  )}
                >
                  <item.icon size={19} className="transition-transform duration-500 group-hover:rotate-6" />
                </div>
                <span className="flex-1 truncate text-start font-bold tracking-tight transition-colors duration-300">
                  {item.label}
                </span>
                {isActive && (
                  <div className={cn(
                    "absolute w-1.5 h-6 bg-primary rounded-full shadow-glow",
                    dir === "rtl" ? "right-[-16px]" : "left-[-16px]"
                  )} />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-4 py-6 space-y-4 relative z-20">
        <div className="group/profile relative transition-all duration-500 bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-3xl p-3 shadow-premium backdrop-blur-md overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-3 transition-all duration-500 px-1 pt-1">
              <div className="relative shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-[12px] font-black text-primary-foreground shadow-md">
                  <Shield size={16} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-sidebar rounded-full z-20 shadow-sm" />
              </div>

              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-[13.5px] font-black text-foreground truncate leading-none tracking-tight">
                  {user.name}
                </p>
                <p className="text-muted-foreground/60 text-[10px] font-bold truncate uppercase tracking-widest mt-1">
                  {nav.super_admin}
                </p>
              </div>

              {onSignOut && (
                <div className="opacity-40 hover:opacity-100 hover:scale-110 transition-all active:scale-95 shrink-0">
                  <SignOutButton onSignOut={onSignOut} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
