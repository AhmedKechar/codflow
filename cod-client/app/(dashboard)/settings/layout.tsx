"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Store, Search, Star, BarChart2, Key, Lock, ChevronRight, Sparkles, Mail } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";
import { getMyStore, updateMyStore, type StoreConfig } from "@/actions/stores";

interface SettingsContextValue {
  storeConfig: StoreConfig | null;
  handleSave: (payload: Parameters<typeof updateMyStore>[0]) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettingsContext() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettingsContext must be used within SettingsLayout");
  return ctx;
}

type NavGroupId = "store" | "commerce" | "system";

interface SettingsNavGroup {
  id: NavGroupId;
  labelKey: string;
  items: SettingsNavItem[];
}

interface SettingsNavItem {
  href: string;
  labelKey: string;
  icon: typeof Store;
}

const NAV_GROUPS: SettingsNavGroup[] = [
  {
    id: "store",
    labelKey: "store_group",
    items: [
      { href: "/settings/general", labelKey: "general", icon: Store },
    ],
  },
  {
    id: "commerce",
    labelKey: "commerce_group",
    items: [
      { href: "/settings/seo", labelKey: "seo_title", icon: Search },
      { href: "/settings/reviews", labelKey: "reviews_title", icon: Star },
    ],
  },
  {
    id: "system",
    labelKey: "system_group",
    items: [
      { href: "/settings/tracking", labelKey: "tracking_title", icon: BarChart2 },
      { href: "/settings/email", labelKey: "email_title", icon: Mail },
      { href: "/settings/mcp", labelKey: "mcp_title", icon: Sparkles },
      { href: "/settings/api", labelKey: "api_key_title", icon: Key },
      { href: "/settings/security", labelKey: "security_title", icon: Lock },
    ],
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useSettings();
  const s = t.store;
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";

  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyStore().then((data) => {
      if (data) setStoreConfig(data);
      setLoading(false);
    });
  }, []);

  const handleSave = useCallback(
    async (payload: Parameters<typeof updateMyStore>[0]) => {
      try {
        const updated = await updateMyStore(payload);
        setStoreConfig(updated);
        toast.success(s.saved);
      } catch (error) {
        toast.error(s.save_error);
        console.error("Save failed:", error);
      }
    },
    [s.saved, s.save_error],
  );

  const getLabel = (labelKey: string) => {
    const navLabels: Record<string, string> = {
      store_group: "المتجر",
      commerce_group: "التجارة",
      system_group: "النظام",
    };
    const storeLabels = s as Record<string, string>;
    return navLabels[labelKey] ?? storeLabels[labelKey] ?? labelKey;
  };

  const isActive = (href: string) => pathname === href;

  return (
    <SettingsContext.Provider value={{ storeConfig, handleSave, loading }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-black text-foreground">{s.title}</h1>

        <div className="flex gap-8 items-start">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-[200px] shrink-0">
            <nav
              className="sticky top-6 rounded-xl border border-border bg-card p-3 space-y-3"
              aria-label="Settings navigation"
            >
              {NAV_GROUPS.map((group, groupIdx) => (
                <div key={group.id}>
                  {groupIdx > 0 && <div className="h-px bg-border my-2" />}
                  <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {getLabel(group.labelKey)}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            active
                              ? "bg-muted text-foreground border-s-2 border-foreground ps-[10px]"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <Icon size={16} className="shrink-0" />
                          <span>{getLabel(item.labelKey)}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </SettingsContext.Provider>
  );
}
