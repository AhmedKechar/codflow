import type { BorderRadius, ShadowIntensity } from "cod-shared/design-presets";
import { DESIGN_PRESETS } from "cod-shared/design-presets";

export type { BorderRadius, ShadowIntensity };

export interface ThemeInfo {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  fontFamily: string;
  borderRadius: BorderRadius;
  shadowIntensity: ShadowIntensity;
  preview: {
    gradient: string;
    style: BorderRadius;
  };
}

export const AVAILABLE_THEMES: ThemeInfo[] = DESIGN_PRESETS.map((preset) => ({
  id: preset.id,
  name: preset.name,
  description: preset.description,
  primaryColor: preset.colors.primary,
  accentColor: preset.colors.accent,
  bgColor: preset.colors.bg,
  fontFamily: preset.colors.font,
  borderRadius: preset.borderRadius,
  shadowIntensity: preset.shadowIntensity,
  preview: {
    gradient: preset.preview.gradient,
    style: preset.preview.corners,
  },
}));
