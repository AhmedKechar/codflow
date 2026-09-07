/**
 * Site Builder — single source of truth for the storefront's layout & section
 * configuration. Imported by cod-client (dashboard) and cod-astro (storefront).
 *
 * The theme keeps its fixed set of reusable section components; this module
 * describes which sections are shown, in what order, and their per-area
 * settings (header, hero, homepage body, footer, socials, ...). It is stored
 * as a JSON string on the `stores` row (site_json) and merged over defaults so
 * an empty/unset config yields the exact current storefront (backward
 * compatible).
 *
 * DO NOT duplicate these definitions elsewhere.
 */

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "whatsapp"
  | "youtube"
  | "x"
  | "telegram";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export interface NavLink {
  label: string;
  href: string;
}

/** Homepage section ids that map 1:1 to theme components in index.astro. */
export type HomeSectionId =
  | "hero"
  | "categoryCards"
  | "bestSellers"
  | "howItWorks"
  | "newArrivals"
  | "featuresBar"
  | "whatsappCta"
  | "testimonials";

export interface HomeSectionConfig {
  id: HomeSectionId;
  enabled: boolean;
  order: number;
  /** Optional per-section text override merged over the language pack. */
  title?: string;
}

export interface HeaderConfig {
  showSearch: boolean;
  showStoreButton: boolean;
  showSocials: boolean;
  navLinks: NavLink[];
}

export interface HeroConfig {
  enabled: boolean;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
}

export interface FooterConfig {
  showBrand: boolean;
  showLinks: boolean;
  showSocials: boolean;
}

/** All-products listing page (see pages/products/index.astro). */
export interface ProductsConfig {
  /** Grid columns on desktop / mobile. */
  desktopCols: number;
  mobileCols: number;
  /** Show the category filter bar. */
  showCategoryFilter: boolean;
  /** Show the sort dropdown. */
  showSort: boolean;
  /** Number of products shown per page. */
  pageSize: number;
}

/** Product detail page (see pages/products/[slug].astro). */
export interface ProductPageConfig {
  showGallery: boolean;
  showInfo: boolean;
  showOrderForm: boolean;
  showReviews: boolean;
  showShipping: boolean;
  showTrustSeals: boolean;
  showStickyCta: boolean;
  showUrgencyPopup: boolean;
  showConversionSignals: boolean;
}

/** Order form configuration (merchant can customize per-store). */
export interface OrderFormConfig {
  showName: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showAddress: boolean;
  showWilaya: boolean;
  showCommune: boolean;
  showDeliveryType: boolean;
  showNotes: boolean;
  showQuantity: boolean;
  submitButtonText: string;
  summaryDisplay: "open" | "closed" | "hidden";
  popupEnabled: boolean;
  popupDelaySeconds: number;
  popupDiscountPercent: number;
  popupDiscountCode: string;
  popupExpiresAt: string;
  stickyCtaEnabled: boolean;
  showUrgencySignals: boolean;
}

/** Thank-you page (see pages/thank-you.astro). */
export interface ThankYouConfig {
  showOrderNumber: boolean;
  showTotal: boolean;
  showSteps: boolean;
  showBackToStore: boolean;
}

/** Built-in storefront page visibility. */
export interface PagesConfig {
  showProductsPage: boolean;
  showCategoryPages: boolean;
  showAnnouncementBar: boolean;
}

export interface SiteBuilderConfig {
  header: HeaderConfig;
  hero: HeroConfig;
  footer: FooterConfig;
  socials: SocialLink[];
  home: {
    sections: HomeSectionConfig[];
    /** Number of product rows on desktop / mobile for product-grid sections. */
    rowsDesktop: number;
    rowsMobile: number;
    /** Grid columns for product-grid sections (desktop / mobile). */
    columnsDesktop: number;
    columnsMobile: number;
  };
  products: ProductsConfig;
  productPage: ProductPageConfig;
  thankYou: ThankYouConfig;
  pages: PagesConfig;
}

const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: "navNewArrivals", href: "/#new-arrivals" },
  { label: "navBestSellers", href: "/#best-sellers" },
  { label: "navProducts", href: "/products" },
  { label: "navContact", href: "/#how-it-works" },
];

/** Matches the current hardcoded homepage section order exactly. */
const DEFAULT_HOME_SECTIONS: HomeSectionConfig[] = [
  { id: "hero", enabled: true, order: 0 },
  { id: "categoryCards", enabled: true, order: 1 },
  { id: "bestSellers", enabled: true, order: 2 },
  { id: "howItWorks", enabled: true, order: 3 },
  { id: "newArrivals", enabled: true, order: 4 },
  { id: "featuresBar", enabled: true, order: 5 },
  { id: "whatsappCta", enabled: true, order: 6 },
  { id: "testimonials", enabled: true, order: 7 },
];

export function getDefaultSiteBuilder(): SiteBuilderConfig {
  return {
    header: {
      showSearch: true,
      showStoreButton: true,
      showSocials: false,
      navLinks: DEFAULT_NAV_LINKS.map((l) => ({ ...l })),
    },
    hero: {
      enabled: true,
    },
    footer: {
      showBrand: true,
      showLinks: true,
      showSocials: false,
    },
    socials: [],
    home: {
      sections: DEFAULT_HOME_SECTIONS.map((s) => ({ ...s })),
      rowsDesktop: 1,
      rowsMobile: 2,
      columnsDesktop: 4,
      columnsMobile: 2,
    },
    products: {
      desktopCols: 4,
      mobileCols: 2,
      showCategoryFilter: true,
      showSort: false,
      pageSize: 12,
    },
    productPage: {
      showGallery: true,
      showInfo: true,
      showOrderForm: true,
      showReviews: true,
      showShipping: true,
      showTrustSeals: true,
      showStickyCta: true,
      showUrgencyPopup: true,
      showConversionSignals: true,
    },
    thankYou: {
      showOrderNumber: true,
      showTotal: true,
      showSteps: true,
      showBackToStore: true,
    },
    pages: {
      showProductsPage: true,
      showCategoryPages: true,
      showAnnouncementBar: true,
    },
  };
}

/**
 * Merges persisted (partial) site builder overrides over the defaults.
 * Never throws; returns defaults on invalid input (same contract as contentJson).
 */
export function mergeSiteBuilder(raw: unknown): SiteBuilderConfig {
  const defaults = getDefaultSiteBuilder();

  if (!raw || typeof raw !== "object") return defaults;

  const input = raw as Record<string, unknown>;

  const result: SiteBuilderConfig = {
    header: {
      ...defaults.header,
      ...(isRecord(input.header) ? input.header : {}),
    },
    hero: {
      ...defaults.hero,
      ...(isRecord(input.hero) ? input.hero : {}),
    },
    footer: {
      ...defaults.footer,
      ...(isRecord(input.footer) ? input.footer : {}),
    },
    socials: Array.isArray(input.socials)
      ? (input.socials as SocialLink[])
      : defaults.socials,
    home: {
      ...defaults.home,
      ...(isRecord(input.home) ? input.home : {}),
    },
    products: {
      ...defaults.products,
      ...(isRecord(input.products) ? input.products : {}),
    },
    productPage: {
      ...defaults.productPage,
      ...(isRecord(input.productPage) ? input.productPage : {}),
    },
    thankYou: {
      ...defaults.thankYou,
      ...(isRecord(input.thankYou) ? input.thankYou : {}),
    },
    pages: {
      ...defaults.pages,
      ...(isRecord(input.pages) ? input.pages : {}),
    },
  };

  // Home sections: merge by id, keep default order for any missing id.
  const persistedSections = isRecord(input.home) && Array.isArray(input.home.sections)
    ? (input.home.sections as HomeSectionConfig[])
    : [];
  const byId = new Map(persistedSections.map((s) => [s.id, s]));
  result.home.sections = defaults.home.sections
    .map((s) => (byId.has(s.id) ? { ...s, ...byId.get(s.id)! } : { ...s }))
    .sort((a, b) => a.order - b.order);

  return result;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export type { SiteBuilderConfig as SiteBuilder };
