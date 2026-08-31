"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard,
  Package,
  PackageX,
  Users,
  Layers,
  Tag,
  FolderOpen,
  Truck,
  Building2,
  Settings,
  Shield,
  ChevronDown,
  Command,
  Star,
  Gift,
  Globe,
  Sparkles,
  CreditCard,
  Workflow,
  Store,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { DashboardBrand } from "@/lib/brand";

interface SidebarProps {
  brand?: DashboardBrand;
  storeDomain?: string | null;
  stockAlertCount?: number;
  userScopes?: string[];
  role?: string;
}

interface NavItem {
  href?: string;
  label: string;
  icon: any;
  badge?: string | number | null;
  items?: { href: string; label: string; icon: any }[];
  external?: boolean;
}

export function Sidebar({ brand, storeDomain, stockAlertCount, userScopes = [], role = "staff" }: SidebarProps) {
  const pathname = usePathname();
  const { dir } = useLanguage();
  const nav = useNavigation();
  const isRtl = dir === "rtl";
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved === "true") setCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar-collapsed", String(next));
      } catch {}
      return next;
    });
  }, []);

  const canSee = useCallback(
    (scope: string): boolean => {
      if (role === "admin") return true;
      return userScopes.includes("*") || userScopes.includes(scope);
    },
    [role, userScopes],
  );

  const navSections = useMemo(() => {
    const firstSection: NavItem[] = [
      canSee("dashboard:view") && { href: "/dashboard", label: nav.sidebar.dashboard, icon: LayoutDashboard },
      canSee("orders:read") && {
        href: "/orders",
        label: nav.sidebar.orders,
        icon: ShoppingBag,
        items: [{ href: "/orders/abandoned", label: nav.sidebar.orders_abandoned ?? "Abandoned Orders", icon: PackageX }],
      },
      canSee("customers:read") && {
        href: "/customers",
        label: nav.sidebar.customers,
        icon: Users,
        items: [
          canSee("customer_groups:read") && { href: "/customer-groups", label: nav.sidebar.customer_groups || "Groups", icon: Layers },
          canSee("customer_tags:read") && { href: "/customer-tags", label: nav.sidebar.customer_tags || "Tags", icon: Tag },
        ].filter(Boolean) as { href: string; label: string; icon: any }[],
      },
      canSee("products:read") && {
        href: "/products",
        label: nav.sidebar.products,
        icon: Tag,
        badge: stockAlertCount && stockAlertCount > 0 ? stockAlertCount : null,
        items: [
          canSee("product_groups:read") && { href: "/product-groups", label: nav.sidebar.categories || "Categories", icon: FolderOpen },
          { href: "/products/stock", label: nav.sidebar.stock_management || "Stock", icon: Package },
          canSee("offers:read") && { href: "/offers", label: nav.sidebar.offers || "Offers", icon: Gift },
          canSee("discounts:read") && { href: "/discounts", label: nav.sidebar.discounts || "Discounts", icon: Tag },
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
    ].filter(Boolean) as NavItem[];

    const storeSection: NavItem[] = [
      canSee("settings:view") && {
        href: "/store/theme",
        label: nav.sidebar.store || "Store",
        icon: Store,
        items: [
          { href: "/store/theme", label: nav.sidebar.theme_selector ?? "Theme", icon: Store },
          { href: "/store/gift-cards", label: nav.sidebar.gift_cards ?? "Gift Cards", icon: Gift },
          canSee("custom_domains:read") && { href: "/store/domains", label: nav.sidebar.custom_domains ?? "Domains", icon: Globe },
        ].filter(Boolean) as { href: string; label: string; icon: any }[],
      },
      canSee("subscription:read") && { href: "/billing", label: nav.sidebar.billing || "Billing", icon: CreditCard },
      canSee("ai_credits:read") && { href: "/ai", label: nav.sidebar.ai_assistant ?? "AI Assistant", icon: Sparkles },

    ].filter(Boolean) as NavItem[];

    const bottomSection: NavItem[] = [
      role === "admin" && { href: "/team", label: nav.sidebar.team, icon: Shield },
    ].filter(Boolean) as NavItem[];

    return { firstSection, storeSection, bottomSection };
  }, [nav, stockAlertCount, canSee, storeDomain, role]);

  useEffect(() => {
    [...navSections.firstSection, ...navSections.storeSection, ...navSections.bottomSection].forEach((item) => {
      if (item.items?.some((sub) => pathname === sub.href || pathname.startsWith(sub.href + "/"))) {
        setOpenMenus((prev) => ({ ...prev, [item.label]: true }));
      }
    });
  }, [pathname, navSections]);

  const toggleMenu = useCallback((e: React.MouseEvent, label: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const renderNavItem = (item: NavItem) => {
    const hasSubmenu = !!item.items?.length;
    const isSubmenuOpen = openMenus[item.label];
    const isActive = item.href
      ? pathname === item.href || (pathname.startsWith(item.href + "/") && !item.items?.some((sub) => pathname.startsWith(sub.href)))
      : false;
    const isAnySubActive = item.items?.some((sub) => pathname === sub.href || pathname.startsWith(sub.href + "/"));

    const itemClass = cn(
      "w-full group flex items-center gap-3 rounded-md text-[13px] font-medium transition-colors relative cursor-pointer",
      collapsed ? "justify-center px-0 py-2" : "px-3 py-2",
      isActive || (isAnySubActive && !isSubmenuOpen)
        ? "bg-sidebar-accent text-foreground"
        : "text-foreground hover:text-foreground hover:bg-sidebar-accent",
    );

    const itemContent = (
      <>
        <item.icon
          size={18}
          className={cn(
            "shrink-0 transition-colors",
            isActive || isAnySubActive ? "text-foreground" : "text-foreground/80 group-hover:text-foreground",
          )}
        />

        {!collapsed && (
          <>
            <span className="flex-1 truncate text-start font-medium tracking-tight">{item.label}</span>

            {item.badge && (
              <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-semibold px-1">
                {item.badge}
              </span>
            )}

            {hasSubmenu && (
              <div
                onClick={(e) => toggleMenu(e, item.label)}
                className={cn("p-1 rounded-md hover:bg-sidebar-accent transition-colors group/chevron", isRtl ? "-ms-1" : "-me-1")}
              >
                <ChevronDown
                  size={14}
                  className={cn("transition-transform opacity-40 group-hover/opacity-80", isSubmenuOpen && "rotate-180 opacity-80")}
                />
              </div>
            )}
          </>
        )}
      </>
    );

    const wrapped = collapsed ? (
      <Tooltip>
        <TooltipTrigger render={<div className={itemClass} />}>{itemContent}</TooltipTrigger>
        <TooltipContent side={isRtl ? "left" : "right"} sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    ) : item.href ? (
      item.external ? (
        <a href={item.href} target="_blank" rel="noopener noreferrer" className={itemClass}>
          {itemContent}
        </a>
      ) : (
        <Link href={item.href} className={itemClass}>
          {itemContent}
        </Link>
      )
    ) : (
      <div className={itemClass} onClick={(e) => hasSubmenu && toggleMenu(e, item.label)}>
        {itemContent}
      </div>
    );

    if (collapsed || !hasSubmenu) return wrapped;

    return (
      <div className="space-y-0.5">
        {item.href ? (
          item.external ? (
            <a href={item.href} target="_blank" rel="noopener noreferrer" className={itemClass}>
              {itemContent}
            </a>
          ) : (
            <Link href={item.href} className={itemClass}>
              {itemContent}
            </Link>
          )
        ) : (
          <div className={itemClass} onClick={(e) => hasSubmenu && toggleMenu(e, item.label)}>
            {itemContent}
          </div>
        )}

        {hasSubmenu && isSubmenuOpen && (
          <div className={cn("space-y-0.5", collapsed ? "hidden" : "")}>
            <div className={cn("relative space-y-0.5", isRtl ? "me-6 ms-6" : "ms-6 me-6")}>
              {/* Vertical line indicator */}
              <div className={cn(
                "absolute top-1 bottom-1 w-px bg-border/60",
                isRtl ? "right-0" : "left-0"
              )} />
              {item.items?.map((sub) => {
                const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + "/");
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={cn(
                      "flex items-center gap-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors group/sub relative",
                      isRtl ? "pr-3 pl-2" : "pl-3 pr-2",
                      isSubActive
                        ? "text-foreground bg-sidebar-accent/80"
                        : "text-foreground/70 hover:text-foreground hover:bg-sidebar-accent/60",
                    )}
                  >
                    <span className="flex-1 truncate text-start tracking-tight">{sub.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSection = (items: NavItem[], sectionKey: string) => (
    <div key={sectionKey} className="space-y-0.5">
      {items.map((item) => (
        <div key={item.label}>{renderNavItem(item)}</div>
      ))}
    </div>
  );

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 bg-sidebar overflow-hidden transition-all duration-300",
        collapsed ? "w-[60px]" : "w-[240px]",
      )}
    >
      {/* Logo Section — Black header matching navbar, no border */}
      <div className={cn(
        "flex items-center h-14 shrink-0 bg-foreground",
        collapsed ? "justify-center px-2" : "gap-3 px-5"
      )}>
        {!collapsed ? (
          <span className="text-[18px] font-bold tracking-wide text-background" style={{ fontFamily: "var(--font-latin), var(--font-cairo), sans-serif" }}>
            COD FLOW
          </span>
        ) : (
          <span className="text-[14px] font-bold text-background" style={{ fontFamily: "var(--font-latin), var(--font-cairo), sans-serif" }}>
            CF
          </span>
        )}
      </div>

      {/* Nav Items Section */}
      <nav className={cn("py-2 overflow-y-auto overflow-x-hidden relative border-e border-sidebar-border flex-1", collapsed ? "px-2" : "px-3")}>
        <div className="space-y-0.5">
          {renderSection(navSections.firstSection, "main")}

          {renderSection(navSections.storeSection, "store")}

          {renderSection(navSections.bottomSection, "bottom")}
        </div>
      </nav>

      {/* Settings + Collapse - Detached bottom section */}
      <div className={cn("shrink-0 border-t border-sidebar-border mt-1", collapsed ? "p-2" : "p-3")}>
        <div className={cn("flex items-center justify-between", collapsed ? "gap-0" : "gap-2")}>
          {/* Settings Link */}
          {(() => {
            const isSettingsActive = pathname === "/settings" || pathname.startsWith("/settings/");
            const settingsClass = cn(
              "flex items-center gap-2.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer py-2",
              collapsed ? "justify-center px-0" : "flex-1 px-3",
              isSettingsActive
                ? "bg-sidebar-accent text-foreground"
                : "text-foreground hover:text-foreground hover:bg-sidebar-accent",
            );
            const settingsContent = (
              <>
                <Settings
                  size={18}
                  className={cn(
                    "shrink-0 transition-colors",
                    isSettingsActive ? "text-foreground" : "text-foreground/80",
                  )}
                />
                {!collapsed && (
                  <span className="flex-1 text-start font-medium">{nav.sidebar.settings}</span>
                )}
              </>
            );
            return collapsed ? (
              <Tooltip>
                <TooltipTrigger render={<div className={settingsClass} />}>{settingsContent}</TooltipTrigger>
                <TooltipContent side={isRtl ? "left" : "right"} sideOffset={8}>
                  {nav.sidebar.settings}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link href="/settings" className={settingsClass}>
                {settingsContent}
              </Link>
            );
          })()}

          {/* Collapse Button */}
          <button
            onClick={toggleCollapsed}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors text-foreground/80 hover:text-foreground hover:bg-sidebar-accent cursor-pointer shrink-0"
            title={collapsed ? (nav.menu?.expand || "Expand") : (nav.menu?.collapse || "Collapse")}
          >
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger render={<div className="flex items-center justify-center" />}>
                  <PanelLeftOpen size={14} />
                </TooltipTrigger>
                <TooltipContent side={isRtl ? "left" : "right"} sideOffset={8}>
                  {nav.menu?.expand || "Expand"}
                </TooltipContent>
              </Tooltip>
            ) : (
              <PanelLeftClose size={14} className="shrink-0" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
