/**
 * Centralized Scope Definitions for RBAC System
 * 
 * This file defines all permission scopes used throughout the application.
 * Scopes follow the format: resource:action
 * 
 * These definitions are shared between frontend and backend to ensure
 * consistent permission checking across the entire system.
 */

export const SCOPES = {
  // Dashboard
  /** View dashboard overview and statistics */
  DASHBOARD_VIEW: "dashboard:view",
  
  // Orders
  /** View orders list and order details */
  ORDERS_READ: "orders:read",
  /** Create new orders */
  ORDERS_CREATE: "orders:create",
  /** Update order status and details */
  ORDERS_UPDATE: "orders:update",
  /** Cancel or delete orders */
  ORDERS_DELETE: "orders:delete",
  /** Assign orders to drivers */
  ORDERS_ASSIGN: "orders:assign",
  
  // Customers
  /** View customers list and customer profiles */
  CUSTOMERS_READ: "customers:read",
  /** Create new customers */
  CUSTOMERS_CREATE: "customers:create",
  /** Update customer information */
  CUSTOMERS_UPDATE: "customers:update",
  /** Delete customers */
  CUSTOMERS_DELETE: "customers:delete",
  
  // Products
  /** View products catalog */
  PRODUCTS_READ: "products:read",
  /** Create new products */
  PRODUCTS_CREATE: "products:create",
  /** Update product information */
  PRODUCTS_UPDATE: "products:update",
  /** Delete products */
  PRODUCTS_DELETE: "products:delete",
  /** Manage product variations and inventory */
  PRODUCTS_MANAGE: "products:manage",
  
  // Delivery
  /** View drivers and delivery information */
  DELIVERY_READ: "delivery:read",
  /** Create new drivers */
  DELIVERY_CREATE: "delivery:create",
  /** Update driver information */
  DELIVERY_UPDATE: "delivery:update",
  /** Delete drivers */
  DELIVERY_DELETE: "delivery:delete",
  /** Assign orders to drivers */
  DELIVERY_ASSIGN: "delivery:assign",
  /** Manage drivers and delivery settings */
  DELIVERY_MANAGE: "delivery:manage",
  /** Dispatch orders to third-party delivery company APIs (create shipments) */
  DELIVERY_DISPATCH: "delivery:dispatch",
  
  // Customer Groups
  /** View customer groups */
  CUSTOMER_GROUPS_READ: "customer_groups:read",
  /** Create, update, delete customer groups and manage members */
  CUSTOMER_GROUPS_MANAGE: "customer_groups:manage",

  // Customer Tags
  /** View customer tags */
  CUSTOMER_TAGS_READ: "customer_tags:read",
  /** Create, update, delete customer tags and manage assignments */
  CUSTOMER_TAGS_MANAGE: "customer_tags:manage",

  // Product Groups
  /** View product groups and collections */
  PRODUCT_GROUPS_READ: "product_groups:read",
  /** Create, update, delete product groups */
  PRODUCT_GROUPS_MANAGE: "product_groups:manage",

  // Stock
  /** View stock levels and movement history */
  STOCK_READ: "stock:read",
  /** Adjust stock quantities */
  STOCK_MANAGE: "stock:manage",


  // Settings
  /** View settings pages */
  SETTINGS_VIEW: "settings:view",
  /** Manage team members and permissions */
  SETTINGS_TEAM: "settings:team",
  /** Manage integrations and API connections */
  SETTINGS_INTEGRATIONS: "settings:integrations",
  /** Manage notification templates */
  SETTINGS_NOTIFICATIONS: "settings:notifications",
  /** Manage WhatsApp OTP verification settings */
  SETTINGS_VERIFICATION: "settings:verification",
  /** Manage transactional email sending settings */
  SETTINGS_EMAIL: "settings:email",

  // Reviews
  /** View product reviews and their moderation status */
  REVIEWS_READ: "reviews:read",
  /** Approve, reject, and delete product reviews */
  REVIEWS_MANAGE: "reviews:manage",

  // Offers
  /** View promotional offers list */
  OFFERS_READ: "offers:read",
  /** Create, update, and delete promotional offers */
  OFFERS_MANAGE: "offers:manage",

  // Discount Codes
  /** View discount codes list */
  DISCOUNTS_READ: "discounts:read",
  /** Create, update, and delete discount codes */
  DISCOUNTS_MANAGE: "discounts:manage",

  // Gift Cards
  /** View gift cards list */
  GIFT_CARDS_READ: "gift_cards:read",
  /** Create, update, delete, and redeem gift cards */
  GIFT_CARDS_MANAGE: "gift_cards:manage",

  // Abandoned Orders
  /** View abandoned orders list and stats */
  ABANDONED_ORDERS_READ: "abandoned_orders:read",
  /** Update status and delete abandoned order records */
  ABANDONED_ORDERS_MANAGE: "abandoned_orders:manage",

  // MCP (remote AI agents via Model Context Protocol)
  /**
   * Access the /mcp page to view and manage your OWN connected AI apps
   * (Claude Desktop, Claude.ai, ChatGPT, etc.). Can see your own MCP URL,
   * your consent grants, and revoke your own connections. Does NOT let
   * the holder see other team members' connections — that's admin-only.
   */
  MCP_VIEW: "mcp:view",

  // Subscriptions
  /** View subscription details and plan information */
  SUBSCRIPTIONS_READ: "subscriptions:read",
  /** Manage (upgrade, downgrade, cancel) store subscription */
  SUBSCRIPTIONS_MANAGE: "subscriptions:manage",

  // Payments
  /** View payment history and receipt status */
  PAYMENTS_READ: "payments:read",
  /** Submit payment receipts and manage payment methods */
  PAYMENTS_MANAGE: "payments:manage",
  /** Approve or reject payment receipts (super admin only) */
  PAYMENTS_APPROVE: "payments:approve",

  // AI Credits
  /** View AI credit balance and usage history */
  AI_CREDITS_READ: "ai_credits:read",
  /** Manage AI credit allocations and usage */
  AI_CREDITS_MANAGE: "ai_credits:manage",

  // Store Members
  /** View team members and their roles */
  STORE_MEMBERS_READ: "store_members:read",
  /** Add, update, or remove team members */
  STORE_MEMBERS_MANAGE: "store_members:manage",
  /** Send team invitations */
  STORE_MEMBERS_INVITE: "store_members:invite",

  // Provider API Keys (super admin)
  /** View provider API keys */
  PROVIDER_API_KEYS_READ: "provider_api_keys:read",
  /** Manage provider API keys */
  PROVIDER_API_KEYS_MANAGE: "provider_api_keys:manage",

  // Custom Domains
  /** View custom domain configuration */
  CUSTOM_DOMAINS_READ: "custom_domains:read",
  /** Manage custom domain setup and verification */
  CUSTOM_DOMAINS_MANAGE: "custom_domains:manage",

  // Messaging
  /** View WhatsApp and SMS message history */
  MESSAGING_READ: "messaging:read",
  /** Manage messaging settings and templates */
  MESSAGING_MANAGE: "messaging:manage",
  /** Send WhatsApp and SMS messages */
  MESSAGING_SEND: "messaging:send",

  // Wildcard (admin only)
  /** All permissions - admin users only */
  ALL: "*",
} as const;

/**
 * Type representing any valid scope string
 */
export type Scope = typeof SCOPES[keyof typeof SCOPES];

/**
 * Array of all defined scopes (excluding wildcard)
 */
export const ALL_SCOPES = Object.values(SCOPES).filter(scope => scope !== "*");

/**
 * Scope categories for UI grouping
 */
export const SCOPE_CATEGORIES = {
  dashboard: {
    label: "Dashboard",
    scopes: [SCOPES.DASHBOARD_VIEW],
  },
  orders: {
    label: "Orders",
    scopes: [
      SCOPES.ORDERS_READ,
      SCOPES.ORDERS_CREATE,
      SCOPES.ORDERS_UPDATE,
      SCOPES.ORDERS_DELETE,
      SCOPES.ORDERS_ASSIGN,
    ],
  },
  customers: {
    label: "Customers",
    scopes: [
      SCOPES.CUSTOMERS_READ,
      SCOPES.CUSTOMERS_CREATE,
      SCOPES.CUSTOMERS_UPDATE,
      SCOPES.CUSTOMERS_DELETE,
    ],
  },
  customerGroups: {
    label: "Customer Groups",
    scopes: [SCOPES.CUSTOMER_GROUPS_READ, SCOPES.CUSTOMER_GROUPS_MANAGE],
  },
  customerTags: {
    label: "Customer Tags",
    scopes: [SCOPES.CUSTOMER_TAGS_READ, SCOPES.CUSTOMER_TAGS_MANAGE],
  },
  products: {
    label: "Products",
    scopes: [
      SCOPES.PRODUCTS_READ,
      SCOPES.PRODUCTS_CREATE,
      SCOPES.PRODUCTS_UPDATE,
      SCOPES.PRODUCTS_DELETE,
      SCOPES.PRODUCTS_MANAGE,
    ],
  },
  delivery: {
    label: "Delivery",
    scopes: [
      SCOPES.DELIVERY_READ,
      SCOPES.DELIVERY_CREATE,
      SCOPES.DELIVERY_UPDATE,
      SCOPES.DELIVERY_DELETE,
      SCOPES.DELIVERY_ASSIGN,
      SCOPES.DELIVERY_MANAGE,
      SCOPES.DELIVERY_DISPATCH,
    ],
  },
  productGroups: {
    label: "Product Groups",
    scopes: [SCOPES.PRODUCT_GROUPS_READ, SCOPES.PRODUCT_GROUPS_MANAGE],
  },
  stock: {
    label: "Stock",
    scopes: [SCOPES.STOCK_READ, SCOPES.STOCK_MANAGE],
  },
  reviews: {
    label: "Reviews",
    scopes: [SCOPES.REVIEWS_READ, SCOPES.REVIEWS_MANAGE],
  },
  offers: {
    label: "Offers",
    scopes: [SCOPES.OFFERS_READ, SCOPES.OFFERS_MANAGE],
  },
  discounts: {
    label: "Discount Codes",
    scopes: [SCOPES.DISCOUNTS_READ, SCOPES.DISCOUNTS_MANAGE],
  },
  giftCards: {
    label: "Gift Cards",
    scopes: [SCOPES.GIFT_CARDS_READ, SCOPES.GIFT_CARDS_MANAGE],
  },
  abandonedOrders: {
    label: "Abandoned Orders",
    scopes: [SCOPES.ABANDONED_ORDERS_READ, SCOPES.ABANDONED_ORDERS_MANAGE],
  },
  mcp: {
    label: "AI Agents (MCP)",
    scopes: [SCOPES.MCP_VIEW],
  },
  subscriptions: {
    label: "Subscriptions",
    scopes: [SCOPES.SUBSCRIPTIONS_READ, SCOPES.SUBSCRIPTIONS_MANAGE],
  },
  payments: {
    label: "Payments",
    scopes: [SCOPES.PAYMENTS_READ, SCOPES.PAYMENTS_MANAGE, SCOPES.PAYMENTS_APPROVE],
  },
  aiCredits: {
    label: "AI Credits",
    scopes: [SCOPES.AI_CREDITS_READ, SCOPES.AI_CREDITS_MANAGE],
  },
  storeMembers: {
    label: "Team Members",
    scopes: [SCOPES.STORE_MEMBERS_READ, SCOPES.STORE_MEMBERS_MANAGE, SCOPES.STORE_MEMBERS_INVITE],
  },
  providerApiKeys: {
    label: "Provider API Keys",
    scopes: [SCOPES.PROVIDER_API_KEYS_READ, SCOPES.PROVIDER_API_KEYS_MANAGE],
  },
  customDomains: {
    label: "Custom Domains",
    scopes: [SCOPES.CUSTOM_DOMAINS_READ, SCOPES.CUSTOM_DOMAINS_MANAGE],
  },
  messaging: {
    label: "Messaging",
    scopes: [SCOPES.MESSAGING_READ, SCOPES.MESSAGING_MANAGE, SCOPES.MESSAGING_SEND],
  },
} as const;
