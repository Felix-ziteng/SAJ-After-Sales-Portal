"use client";

import { ALL_LOCALES, useTranslation, type Locale } from "@/lib/i18n/LocaleProvider";

/** A `<select>` rather than a button group — three options, always visible, no extra click to
 * open a menu. `dark` flips it for use on the dark `AppHeader` bar vs. the light login/confirm
 * pages. */
export function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <select
      aria-label={t("language.label")}
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className={
        dark
          ? "rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200"
          : "rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600"
      }
    >
      {ALL_LOCALES.map((l) => (
        <option key={l} value={l}>
          {t(`language.${l}`)}
        </option>
      ))}
    </select>
  );
}
