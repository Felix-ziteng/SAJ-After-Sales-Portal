"use client";

import { useState, type InputHTMLAttributes } from "react";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/** Drop-in replacement for `<input type="password">` — spreads through to the underlying
 * input, so every existing call site keeps its own className/placeholder/etc, and just gains a
 * Show/Hide toggle. */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${className ?? ""} pr-12`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-slate-500 hover:text-slate-700"
      >
        {visible ? t("common.hide") : t("common.show")}
      </button>
    </div>
  );
}
