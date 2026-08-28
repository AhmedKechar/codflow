import { z } from "astro/zod";
import { 
  ProductSchema, 
  CategorySchema, 
  ProductImageSchema, 
  ProductVariantSchema,
  OfferSchema
} from "./validation";

export type Product = z.infer<typeof ProductSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type ProductImage = z.infer<typeof ProductImageSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type Offer = z.infer<typeof OfferSchema>;

export interface OrderFormConfig {
  showName?: boolean;
  showPhone?: boolean;
  showEmail?: boolean;
  showAddress?: boolean;
  showWilaya?: boolean;
  showCommune?: boolean;
  showDeliveryType?: boolean;
  showNotes?: boolean;
  showQuantity?: boolean;
  submitButtonText?: string | null;
  summaryDisplay?: "open" | "closed" | "hidden";
}

export interface StoreConfig {
  id: string;
  name: string;
  domain: string | null;
  logoUrl: string | null;
  themeId: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  fontFamily: string;
  fontUrl: string | null;
  borderRadius: "rounded" | "sharp" | "minimal";
  shadowIntensity: "soft" | "medium" | "strong";
  lang: "ar" | "en";
  currency: string;
  currencySymbol: string;
  contentJson: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  announcementBar: string | null;
  reviewsEnabled: boolean;
  status: "active" | "inactive";
  pixelId?: string | null;
  orderFormConfig?: OrderFormConfig | null;
  trustSeals: Record<string, boolean> | null;
}

export interface ShippingRates {
  [wilayaId: string]: { home: number; stopDesk: number };
}

export interface Wilaya {
  id: number;
  name: string;
  nameAr: string;
}

export interface Commune {
  id: string;
  name: string;
  nameAr: string;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
}
