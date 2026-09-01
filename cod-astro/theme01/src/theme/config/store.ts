// ╔══════════════════════════════════════════════════════════════════════╗
// ║  CUSTOMIZE HERE (Custom mode) — DEFAULT_CONFIG only                  ║
// ║  Edit DEFAULT_CONFIG to change fallback colors/font/meta when the    ║
// ║  API is unreachable. All other code in this file is core engine.     ║
// ╚══════════════════════════════════════════════════════════════════════╝
/**
 * Per-request store data helpers.
 * Call once per page — pass the returned config to StoreLayout to avoid
 * duplicate API fetches.
 */
import { fetchStoreConfig } from "@/core/api/client";
import { resolveContent } from "@/theme/content";
import type { StoreConfig } from "@/core/api/types";
import type { StoreFrontContent } from "@/theme/content";
import {
  getDefaultSiteBuilder,
  mergeSiteBuilder,
  type SiteBuilderConfig,
} from "../../../../../cod-shared/site-builder";

export const DEFAULT_CONFIG: StoreConfig = {
  id: "",
  name: "متجري",
  domain: null,
  logoUrl: null,
  themeId: "theme01",
  primaryColor: "#202020",
  accentColor: "#f59e0b",
  bgColor: "#ffffff",
  fontFamily: "Cairo, sans-serif",
  fontUrl: null,
  borderRadius: "rounded",
  shadowIntensity: "soft",
  lang: "ar",
  currency: "DZD",
  currencySymbol: "دج",
  contentJson: null,
  metaTitle: null,
  metaDescription: null,
  ogImage: null,
  announcementBar: null,
  reviewsEnabled: true,
  status: "active",
  pixelId: null,
  trustSeals: null,
  // @ts-expect-error siteJson is added by site-builder but not typed on core StoreConfig
  siteJson: null,
};

export interface StoreContext {
  config: StoreConfig;
  content: StoreFrontContent;
  isRTL: boolean;
  /** Site-builder layout config, merged over defaults (never null). */
  siteBuilder: SiteBuilderConfig;
}

/**
 * Reads the raw siteJson string from the store config and merges it over
 * defaults without touching the (immutable) core StoreConfig type.
 */
function readSiteBuilder(config: StoreConfig): SiteBuilderConfig {
  const raw = (config as unknown as { siteJson?: string | null }).siteJson;
  if (!raw) return getDefaultSiteBuilder();
  try {
    return mergeSiteBuilder(JSON.parse(raw));
  } catch {
    return getDefaultSiteBuilder();
  }
}

export async function getStoreContext(): Promise<StoreContext> {
  const config = (await fetchStoreConfig()) ?? DEFAULT_CONFIG;
  const content = resolveContent(config.lang, config.contentJson);
  const isRTL = config.lang === "ar";
  const siteBuilder = readSiteBuilder(config);
  return { config, content, isRTL, siteBuilder };
}
