"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  PackageX,
  Truck,
  MoreHorizontal,
  X,
  Sun,
  Moon,
  Users,
  Layers,
  Settings,
  Shield,
  FolderOpen,
  ChevronDown,
  Command,
  Globe,
  BookOpen,
  Star,
  UserCircle,
  ExternalLink,
  Sparkles,
  Tag,
  Building2,
  Workflow,
  CreditCard,
  Store,
  Gift,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/lib/translations";
import { useLanguage, Locale } from "@/lib/i18n-context";
import type { DashboardBrand } from "@/lib/brand";

interface MobileNavProps {
  userScopes?: string[];
  role?: string;
  brand?: DashboardBrand;
  storeDomain?: string | null;
}

export function MobileNav({ userScopes = [], role = "staff", brand, storeDomain }: MobileNavProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLanguage();
  const nav = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canSee = (scope: string): boolean => {
    if (role === "admin") return true;
    return userScopes.includes("*") || userScopes.includes(scope);
  };

  const primaryNav = [
    canSee("dashboard:view") && { href: "/dashboard", label: nav.mobile.home,      icon: LayoutDashboard },
    canSee("orders:read")    && { href: "/orders",     label: nav.mobile.orders,    icon: ShoppingBag },
    canSee("customers:read") && { href: "/customers",  label: nav.mobile.customers, icon: Users },
  ].filter(Boolean) as { href: string; label: string; icon: any }[];

  const secondaryNav: any[] = [
    canSee("products:read") && {
      href: "/products",
      label: nav.sidebar.products,
      icon: Tag,
      items: [
        canSee("product_groups:read") && { href: "/product-groups", label: nav.sidebar.categories || "Categories", icon: FolderOpen },
        { href: "/products/stock", label: nav.sidebar.stock_management || "Stock", icon: Package },
        canSee("offers:read") && { href: "/offers", label: nav.sidebar.offers || "Offers", icon: Gift },
        canSee("discounts:read") && { href: "/discounts", label: nav.sidebar.discounts || "Discount Codes", icon: Tag },
      ].filter(Boolean) as { href: string; label: string; icon: any }[],
    },
    canSee("delivery:read") && {
      href: "/delivery/drivers",
      label: nav.sidebar.delivery,
      icon: Truck,
      items: [
        { href: "/delivery/drivers", label: nav.sidebar.delivery_drivers ?? "Drivers", icon: Truck },
        { href: "/delivery/companies", label: nav.sidebar.delivery_companies ?? "Companies", icon: Building2 },
        { href: "/delivery/shipping-profiles", label: nav.sidebar.delivery_shipping ?? "Shipping", icon: Package },
      ],
    },
    canSee("messaging:read") && { href: "/messaging", label: nav.sidebar.messaging || "Automation", icon: Workflow },
    canSee("reviews:read") && { href: "/reviews", label: nav.sidebar.reviews || "Reviews", icon: Star },
    { divider: true },
    canSee("settings:view") && { href: "/store/theme", label: nav.sidebar.theme_selector ?? "Store", icon: Store },
    canSee("subscription:read") && { href: "/billing", label: nav.sidebar.billing || "Billing", icon: CreditCard },
    canSee("ai_credits:read") && { href: "/ai", label: nav.sidebar.ai_assistant ?? "AI Assistant", icon: Sparkles },
    { divider: true },
    role === "admin" && { href: "/team", label: nav.sidebar.team, icon: Shield },
    role === "admin" && { href: "/settings", label: nav.sidebar.settings, icon: Settings },
    { href: "/profile", label: nav.mobile.profile || "Profile", icon: UserCircle },
    { href: "/api", label: nav.sidebar.api_reference || "API Reference", icon: BookOpen, external: true },
  ].filter(Boolean);

  useEffect(() => {
    if (!menuOpen) {
      setOpenSubmenu(null);
    } else {
      secondaryNav.forEach((item: any) => {
        if (item.divider || item.external) return;
        if (item.items) {
          const isAnySubActive = item.items.some(
            (subItem: any) => pathname === subItem.href || pathname.startsWith(subItem.href + "/")
          );
          if (isAnySubActive) {
            setOpenSubmenu(item.label);
          }
        }
      });
    }
  }, [menuOpen, pathname]);

  return (
    <>
      {/* Top Bar */}
      <div className="md:hidden flex items-center justify-between h-[64px] px-5 border-b bg-card border-border shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-[18px] font-bold tracking-wide text-foreground" style={{ fontFamily: "var(--font-latin), var(--font-cairo), sans-serif" }}>
            COD FLOW
          </span>
        </div>
        
        {/* Theme & Language Toggles */}
        {mounted && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
              className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:bg-muted transition-colors"
            >
              <Globe size={18} className="text-foreground" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:bg-muted transition-colors"
            >
              {theme === "dark" ? (
                <Sun size={18} className="text-foreground" strokeWidth={2.5} />
              ) : (
                <Moon size={18} className="text-foreground" strokeWidth={2.5} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border safe-area-inset-bottom overflow-hidden">
        <div className={`grid h-[64px]`} style={{ gridTemplateColumns: `repeat(${primaryNav.length + 1}, minmax(0, 1fr))` }}>
            {primaryNav.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 transition-all duration-300 relative",
                    isActive ? "text-primary" : "text-muted-foreground/60 hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-primary/5 animate-fade-in" />
                  )}
                  <div className={cn(
                    "transition-transform duration-300",
                    isActive && "scale-110 -translate-y-0.5"
                  )}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold tracking-tight transition-all",
                    isActive ? "opacity-100" : "opacity-60"
                  )}>{label}</span>
                </Link>
              );
            })}

            {/* More Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-300 relative",
                menuOpen ? "text-primary" : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              {menuOpen && (
                <div className="absolute inset-0 bg-primary/5 animate-fade-in" />
              )}
              <div className={cn(
                "transition-transform duration-300",
                menuOpen && "scale-110 -translate-y-0.5"
              )}>
                {menuOpen ? (
                  <X size={20} strokeWidth={2.5} />
                ) : (
                  <MoreHorizontal size={20} strokeWidth={2} />
                )}
              </div>
              <span className={cn(
                "text-[9px] font-bold tracking-tight transition-all",
                menuOpen ? "opacity-100" : "opacity-60"
              )}>{nav.mobile.more}</span>
            </button>
          </div>
        </nav>

      {/* Secondary Menu Overlay */}
      {menuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-300"
            onClick={() => setMenuOpen(false)}
          />
          <div className="md:hidden fixed bottom-[92px] inset-x-4 z-50 animate-in slide-in-from-bottom-6 duration-400 ease-out">
            <div className="bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.12)] overflow-hidden p-2">
              <div className="space-y-1">
                {storeDomain && (
                  <a
                    href={`https://${storeDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-4 py-3.5 rounded-md transition-colors text-foreground hover:bg-muted"
                  >
                    <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 transition-colors bg-muted text-muted-foreground">
                      <ExternalLink size={18} strokeWidth={2.5} />
                    </div>
                    <span className="text-[14px] font-bold flex-1 text-start tracking-tight">
                      {nav.sidebar.store || "Visit Store"}
                    </span>
                    <ExternalLink size={14} className="text-muted-foreground" />
                  </a>
                )}
                {secondaryNav.map((item: any, idx: number) => {
                  if (item.divider) {
                    return <div key={`divider-${idx}`} className="h-px bg-border my-2" />;
                  }

                  const hasSubmenu = "items" in item;
                  const isAnySubItemActive = hasSubmenu && item.items.some(
                    (subItem: any) => pathname === subItem.href || pathname.startsWith(subItem.href + "/")
                  );

                  let isActive = false;
                  if (hasSubmenu && item.href) {
                    const isParentActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    isActive = isParentActive && !isAnySubItemActive;
                  } else {
                    isActive = hasSubmenu
                      ? isAnySubItemActive
                      : pathname === item.href || pathname.startsWith(item.href + "/");
                  }

                  const isExpanded = openSubmenu === item.label;
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="relative flex items-center">
                        {item.external ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => !hasSubmenu && setMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-4 px-4 py-3.5 rounded-md transition-colors w-full",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground hover:bg-muted"
                            )}
                          >
                            <div className={cn(
                              "w-9 h-9 rounded-md flex items-center justify-center shrink-0 transition-colors",
                              isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                            )}>
                              <Icon size={18} strokeWidth={2.5} />
                            </div>
                            <span className="text-[14px] font-bold flex-1 text-start tracking-tight">{item.label}</span>
                          </a>
                        ) : (
                          <Link
                            href={item.href}
                            onClick={() => !hasSubmenu && setMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-4 px-4 py-3.5 rounded-md transition-colors w-full",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground hover:bg-muted"
                            )}
                          >
                            <div className={cn(
                              "w-9 h-9 rounded-md flex items-center justify-center shrink-0 transition-colors",
                              isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                            )}>
                              <Icon size={18} strokeWidth={2.5} />
                            </div>
                            <span className="text-[14px] font-bold flex-1 text-start tracking-tight">{item.label}</span>
                          </Link>
                        )}
                        {hasSubmenu && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenSubmenu(isExpanded ? null : item.label);
                            }}
                            className={cn(
                              "absolute end-3 w-10 h-10 flex items-center justify-center rounded-md transition-colors",
                              isExpanded
                                ? "bg-white/20 text-white"
                                : isActive
                                  ? "text-white/60 hover:bg-white/10"
                                  : "text-muted-foreground hover:bg-muted",
                              !isActive && isExpanded && "bg-primary/10 text-primary"
                            )}
                          >
                            <ChevronDown
                              size={18}
                              className={cn(
                                "transition-transform duration-300",
                                isExpanded ? "rotate-180" : ""
                              )}
                            />
                          </button>
                        )}
                      </div>
                      {hasSubmenu && isExpanded && (
                        <div className="px-2 pb-2 pt-1 space-y-1 animate-fade-in-up">
                          {item.items.map((subItem: any) => {
                            const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + "/");
                            const SubIcon = subItem.icon;
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                onClick={() => setMenuOpen(false)}
                                className={cn(
                                  "flex items-center gap-4 px-4 py-3 rounded-md transition-colors",
                                  isSubActive
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-muted-foreground hover:bg-muted"
                                )}
                              >
                                <div className={cn(
                                  "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                                  isSubActive ? "bg-primary/10 text-primary" : "bg-transparent text-muted-foreground/40"
                                )}>
                                  <SubIcon size={16} strokeWidth={2.5} />
                                </div>
                                <span className="text-[13px] font-medium">{subItem.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
