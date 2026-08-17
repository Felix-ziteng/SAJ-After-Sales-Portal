"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import { en } from "./dictionaries/en";
import { zh } from "./dictionaries/zh";
import { it } from "./dictionaries/it";
import type { Messages } from "./messages";

export type Locale = "en" | "zh" | "it";

export const ALL_LOCALES: Locale[] = ["en", "zh", "it"];

const DICTIONARIES: Record<Locale, Messages> = { en, zh, it };

/** BCP 47 tags for `Date#toLocaleDateString`/`toLocaleString` — kept separate from `Locale`
 * itself since those APIs want a region-qualified tag, not just a bare language code. */
const DATE_LOCALE_TAGS: Record<Locale, string> = { en: "en-US", zh: "zh-CN", it: "it-IT" };

/** Every dot-path key in the dictionary (e.g. `"admin.deleteAccount"`) — a typo or a key that
 * doesn't exist is a compile error, not a silent blank string at runtime. */
type NestedKeyOf<T> = T extends string
  ? never
  : { [K in keyof T & string]: T[K] extends string ? K : `${K}.${NestedKeyOf<T[K]>}` }[keyof T & string];

export type TranslationKey = NestedKeyOf<Messages>;

function resolvePath(dict: Messages, path: string): string {
  const value = path.split(".").reduce<unknown>((obj, key) => {
    return obj && typeof obj === "object" ? (obj as Record<string, unknown>)[key] : undefined;
  }, dict);
  return typeof value === "string" ? value : path;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Statically-typed lookup for fixed UI copy. */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  /** Dynamic lookups keyed by a backend enum value (`RequestStatus`, `RequestTypeCode`, audit
   * action, confirmation status) — not compile-time checked against the finite enum, since the
   * value comes from an API response, but falls back to the raw value if a key is ever missing. */
  status: (status: string) => string;
  requestType: (type: string) => string;
  auditAction: (action: string) => string;
  confirmationStatus: (status: string) => string;
  role: (role: string) => string;
  userStatus: (status: string) => string;
  /** Date-only, formatted per the active locale (e.g. `08/17/2026` vs `2026/8/17` vs
   * `17/08/2026`) instead of whatever the browser's own locale happens to be. */
  formatDate: (iso: string) => string;
  /** Date + time, same locale-awareness as {@link formatDate}. */
  formatDateTime: (iso: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = usePersistedState<Locale>("locale", "en");

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => {
    const dict = DICTIONARIES[locale];
    const dateTag = DATE_LOCALE_TAGS[locale];
    return {
      locale,
      setLocale,
      t: (key, vars) => interpolate(resolvePath(dict, key), vars),
      status: (status) => resolvePath(dict, `status.${status}`),
      requestType: (type) => resolvePath(dict, `requestType.${type}`),
      auditAction: (action) => resolvePath(dict, `auditAction.${action}`),
      confirmationStatus: (status) => resolvePath(dict, `confirmationStatus.${status}`),
      role: (role) => resolvePath(dict, `role.${role}`),
      userStatus: (status) => resolvePath(dict, `userStatus.${status}`),
      formatDate: (iso) => new Date(iso).toLocaleDateString(dateTag),
      formatDateTime: (iso) => new Date(iso).toLocaleString(dateTag),
    };
  }, [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a LocaleProvider");
  }
  return ctx;
}
