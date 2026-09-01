"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useThemes } from "@/lib/translations";
import { getMyStore, type StoreConfig } from "@/actions/stores";
import { ContextualSaveBar } from "@/components/ui/contextual-save-bar";
import { ThemeSelector } from "@/components/themes/theme-selector";
import { SiteBuilderEditor } from "@/components/themes/site-builder";
import { ProductsEditor } from "@/components/themes/editors/products-editor";
import { ProductPageEditor } from "@/components/themes/editors/product-page-editor";
import { OrderFormEditor } from "@/components/themes/editors/order-form-editor";
import { ThankYouEditor } from "@/components/themes/editors/thank-you-editor";
import { PagesEditor } from "@/components/themes/editors/pages-editor";

type TabId =
  | "appearance"
  | "homepage"
  | "products"
  | "product-page"
  | "order-form"
  | "thank-you"
  | "pages";

type TabLabelKey =
  | "tabAppearance"
  | "tabHomepage"
  | "tabProducts"
  | "tabProductPage"
  | "tabOrderForm"
  | "tabThankYou"
  | "tabPages";

const TABS: { id: TabId; labelKey: TabLabelKey }[] = [
  { id: "appearance", labelKey: "tabAppearance" },
  { id: "homepage", labelKey: "tabHomepage" },
  { id: "products", labelKey: "tabProducts" },
  { id: "product-page", labelKey: "tabProductPage" },
  { id: "order-form", labelKey: "tabOrderForm" },
  { id: "thank-you", labelKey: "tabThankYou" },
  { id: "pages", labelKey: "tabPages" },
];

export function ThemePageContent() {
  const t = useThemes();
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("appearance");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveRef = useRef<(() => Promise<boolean>) | null>(null);

  useEffect(() => {
    getMyStore().then((data) => {
      if (data) setStoreConfig(data);
      setLoading(false);
    });
  }, []);

  const handleThemeChanged = useCallback(() => {
    getMyStore().then((data) => {
      if (data) setStoreConfig(data);
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!saveRef.current) return;
    setIsSaving(true);
    try {
      const ok = await saveRef.current();
      if (ok) {
        setIsDirty(false);
        handleThemeChanged();
      }
    } finally {
      setIsSaving(false);
    }
  }, [handleThemeChanged]);

  const handleDiscard = useCallback(() => {
    setIsDirty(false);
    handleThemeChanged();
  }, [handleThemeChanged]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!storeConfig) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">{t.loading}</p>
      </div>
    );
  }

  const renderTab = () => {
    const editorProps = {
      onDirtyChange: setIsDirty,
      saveRef,
    };
    switch (activeTab) {
      case "appearance":
        return (
          <ThemeSelector
            currentThemeId={storeConfig.themeId}
            currentPrimaryColor={storeConfig.primaryColor}
            currentAccentColor={storeConfig.accentColor}
            currentBgColor={storeConfig.bgColor}
            currentFontFamily={storeConfig.fontFamily}
            currentBorderRadius={storeConfig.borderRadius}
            currentShadowIntensity={storeConfig.shadowIntensity}
            currentTrustSeals={storeConfig.trustSeals}
            onThemeChanged={handleThemeChanged}
            {...editorProps}
          />
        );
      case "homepage":
        return <SiteBuilderEditor siteJson={storeConfig.siteJson} onSaved={handleThemeChanged} {...editorProps} />;
      case "products":
        return <ProductsEditor siteJson={storeConfig.siteJson} onSaved={handleThemeChanged} {...editorProps} />;
      case "product-page":
        return <ProductPageEditor siteJson={storeConfig.siteJson} onSaved={handleThemeChanged} {...editorProps} />;
      case "order-form":
        return (
          <OrderFormEditor
            currentOrderFormConfig={storeConfig.orderFormConfig}
            onSaved={handleThemeChanged}
            {...editorProps}
          />
        );
      case "thank-you":
        return <ThankYouEditor siteJson={storeConfig.siteJson} onSaved={handleThemeChanged} {...editorProps} />;
      case "pages":
        return <PagesEditor siteJson={storeConfig.siteJson} onSaved={handleThemeChanged} {...editorProps} />;
      default:
        return (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">{t.comingSoon}</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <ContextualSaveBar
        id="theme-settings"
        hasChanges={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />

      <h1 className="hidden md:block text-2xl font-black text-foreground">{t.title}</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              "-mb-px inline-flex items-center px-4 py-2.5 text-sm font-semibold transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t[tab.labelKey]}
          </button>
        ))}
      </div>

      {renderTab()}
    </div>
  );
}
