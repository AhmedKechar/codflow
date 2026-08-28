"use client";

import { useState, useTransition } from "react";
import {
  getDefaultSiteBuilder,
  mergeSiteBuilder,
  type SiteBuilderConfig,
} from "cod-shared/site-builder";
import { updateSiteBuilder } from "@/actions/themes";

/**
 * Central state for any area of the site-builder. Loads the persisted siteJson
 * (merged over defaults), tracks dirty state, and persists via the shared
 * `updateSiteBuilder` action. Every tab editor consumes this so save behaviour
 * and normalisation stay identical across the dashboard.
 */
export function useSiteBuilder(siteJson: string | null) {
  const [site, setSite] = useState<SiteBuilderConfig>(() => {
    if (siteJson) {
      try {
        return mergeSiteBuilder(JSON.parse(siteJson));
      } catch {
        // fall through to defaults on malformed json
      }
    }
    return getDefaultSiteBuilder();
  });
  const [pristine, setPristine] = useState(true);
  const [saving, startTransition] = useTransition();

  const update = (updater: (prev: SiteBuilderConfig) => SiteBuilderConfig) => {
    setSite(updater);
    setPristine(false);
  };

  /** Persists and returns true on success (sticky for save bar toasts). */
  const save = () =>
    new Promise<boolean>((resolve) => {
      startTransition(async () => {
        try {
          await updateSiteBuilder(site);
          setPristine(true);
          resolve(true);
        } catch (error) {
          console.error("Site builder save failed:", error);
          resolve(false);
        }
      });
    });

  return { site, update, dirty: !pristine, saving, save };
}
