/**
 * Converts design preset values to CSS variable values.
 * Used by BaseHead.astro to inject runtime tokens.
 *
 * Pure functions — no side effects, no imports from DB or API.
 */

import type { BorderRadius, ShadowIntensity } from "./design-presets";

export interface RadiusTokens {
  card: string;
  input: string;
  btn: string;
}

export interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;
  primary: string;
}

const RADIUS_MAP: Record<BorderRadius, RadiusTokens> = {
  rounded: { card: "1.25rem", input: "1rem", btn: "1rem" },
  sharp:   { card: "0.75rem", input: "0.5rem", btn: "0.5rem" },
  minimal: { card: "0.5rem",  input: "0.375rem", btn: "0.375rem" },
};

const SHADOW_MAP: Record<ShadowIntensity, ShadowTokens> = {
  soft: {
    sm: "0 1px 2px rgba(0,0,0,.04)",
    md: "0 4px 12px rgba(0,0,0,.05), 0 1px 2px rgba(0,0,0,.03)",
    lg: "0 12px 24px rgba(0,0,0,.08), 0 4px 8px rgba(0,0,0,.04)",
    primary: "0 8px 24px color-mix(in srgb, var(--clr-primary) 25%, transparent)",
  },
  medium: {
    sm: "0 1px 3px rgba(0,0,0,.06)",
    md: "0 4px 16px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04)",
    lg: "0 16px 32px rgba(0,0,0,.10), 0 4px 8px rgba(0,0,0,.05)",
    primary: "0 8px 24px color-mix(in srgb, var(--clr-primary) 20%, transparent)",
  },
  strong: {
    sm: "0 1px 2px rgba(0,0,0,.05)",
    md: "0 4px 12px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04)",
    lg: "0 16px 48px rgba(0,0,0,.12), 0 4px 12px rgba(0,0,0,.06)",
    primary: "0 8px 24px color-mix(in srgb, var(--clr-primary) 15%, transparent)",
  },
};

export function getRadiusTokens(style: BorderRadius): RadiusTokens {
  return RADIUS_MAP[style];
}

export function getShadowTokens(intensity: ShadowIntensity): ShadowTokens {
  return SHADOW_MAP[intensity];
}
