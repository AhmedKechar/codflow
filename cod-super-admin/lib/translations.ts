"use client";

import arNavigation from "@/locales/ar/navigation.json";
import arDashboard from "@/locales/ar/dashboard.json";
import arPlans from "@/locales/ar/plans.json";
import arPayments from "@/locales/ar/payments.json";
import arStores from "@/locales/ar/stores.json";
import arUsers from "@/locales/ar/users.json";
import arProviderKeys from "@/locales/ar/provider-keys.json";
import arAuth from "@/locales/ar/auth.json";
import arCommon from "@/locales/ar/common.json";

import enNavigation from "@/locales/en/navigation.json";
import enDashboard from "@/locales/en/dashboard.json";
import enPlans from "@/locales/en/plans.json";
import enPayments from "@/locales/en/payments.json";
import enStores from "@/locales/en/stores.json";
import enUsers from "@/locales/en/users.json";
import enProviderKeys from "@/locales/en/provider-keys.json";
import enAuth from "@/locales/en/auth.json";
import enCommon from "@/locales/en/common.json";

import frNavigation from "@/locales/fr/navigation.json";
import frDashboard from "@/locales/fr/dashboard.json";
import frPlans from "@/locales/fr/plans.json";
import frPayments from "@/locales/fr/payments.json";
import frStores from "@/locales/fr/stores.json";
import frUsers from "@/locales/fr/users.json";
import frProviderKeys from "@/locales/fr/provider-keys.json";
import frAuth from "@/locales/fr/auth.json";
import frCommon from "@/locales/fr/common.json";

import { useLanguage } from "./i18n-context";

export const allTranslations = {
  ar: {
    navigation: arNavigation,
    dashboard: arDashboard,
    plans: arPlans,
    payments: arPayments,
    stores: arStores,
    users: arUsers,
    providerKeys: arProviderKeys,
    auth: arAuth,
    common: arCommon,
  },
  en: {
    navigation: enNavigation,
    dashboard: enDashboard,
    plans: enPlans,
    payments: enPayments,
    stores: enStores,
    users: enUsers,
    providerKeys: enProviderKeys,
    auth: enAuth,
    common: enCommon,
  },
  fr: {
    navigation: frNavigation,
    dashboard: frDashboard,
    plans: frPlans,
    payments: frPayments,
    stores: frStores,
    users: frUsers,
    providerKeys: frProviderKeys,
    auth: frAuth,
    common: frCommon,
  },
};

export type TranslationKey = keyof typeof allTranslations.ar;

export function useTranslations() {
  const { locale } = useLanguage();
  return allTranslations[locale];
}

export const useNavigation = () => useTranslations().navigation;
export const useDashboard = () => useTranslations().dashboard;
export const usePlans = () => useTranslations().plans;
export const usePayments = () => useTranslations().payments;
export const useStores = () => useTranslations().stores;
export const useUsers = () => useTranslations().users;
export const useProviderKeys = () => useTranslations().providerKeys;
export const useAuth = () => useTranslations().auth;
export const useCommon = () => useTranslations().common;

export function t(
  section: TranslationKey,
  path: string,
  locale: "ar" | "en" | "fr" = "ar",
): string {
  const keys = path.split(".");
  let value: any = allTranslations[locale][section];

  for (const key of keys) {
    if (value && typeof value === "object") {
      value = value[key];
    } else {
      return path;
    }
  }

  return typeof value === "string" ? value : path;
}
