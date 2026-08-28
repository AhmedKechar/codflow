/**
 * Single source of truth for theme design presets.
 * Imported by cod-client (dashboard) and cod-astro (storefront).
 *
 * DO NOT duplicate these definitions elsewhere.
 * To add a preset, add it here — consumers import automatically.
 */

export type BorderRadius = "rounded" | "sharp" | "minimal";
export type ShadowIntensity = "soft" | "medium" | "strong";

export interface DesignPreset {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  borderRadius: BorderRadius;
  shadowIntensity: ShadowIntensity;
  colors: {
    primary: string;
    accent: string;
    bg: string;
    font: string;
  };
  preview: {
    gradient: string;
    corners: BorderRadius;
  };
}

export const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: "classic",
    name: "Classic",
    nameAr: "كلاسيكي",
    description: "Friendly, approachable. Rounded corners, soft shadows.",
    borderRadius: "rounded",
    shadowIntensity: "soft",
    colors: {
      primary: "#7c3aed",
      accent: "#f59e0b",
      bg: "#f8f8f8",
      font: "Cairo, sans-serif",
    },
    preview: {
      gradient: "linear-gradient(135deg, #7c3aed 0%, #f59e0b 100%)",
      corners: "rounded",
    },
  },
  {
    id: "maker",
    name: "MAKR",
    nameAr: "ماكر",
    description: "Warm, maker-focused. Sharp corners, medium shadows.",
    borderRadius: "sharp",
    shadowIntensity: "medium",
    colors: {
      primary: "#d97706",
      accent: "#78716c",
      bg: "#faf9f7",
      font: "Inter, sans-serif",
    },
    preview: {
      gradient: "linear-gradient(135deg, #d97706 0%, #78716c 100%)",
      corners: "sharp",
    },
  },
  {
    id: "peak",
    name: "Peak Design",
    nameAr: "بيك",
    description: "High-contrast, bold. Minimal corners, strong shadows.",
    borderRadius: "minimal",
    shadowIntensity: "strong",
    colors: {
      primary: "#000000",
      accent: "#3b82f6",
      bg: "#ffffff",
      font: "Geist, sans-serif",
    },
    preview: {
      gradient: "linear-gradient(135deg, #000000 0%, #3b82f6 100%)",
      corners: "minimal",
    },
  },
];

export function getPresetById(id: string): DesignPreset | undefined {
  return DESIGN_PRESETS.find((p) => p.id === id);
}

export function getPresetByTokens(
  borderRadius: BorderRadius,
  shadowIntensity: ShadowIntensity
): DesignPreset | undefined {
  return DESIGN_PRESETS.find(
    (p) => p.borderRadius === borderRadius && p.shadowIntensity === shadowIntensity
  );
}
