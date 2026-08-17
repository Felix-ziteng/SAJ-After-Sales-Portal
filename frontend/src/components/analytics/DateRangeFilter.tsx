"use client";

import { useState } from "react";
import { useTranslation, type TranslationKey } from "@/lib/i18n/LocaleProvider";

export interface DateRange {
  from: string;
  to: string;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}
function monthStart(): string {
  const d = new Date();
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
}
const today = () => toISODate(new Date());

const PRESETS: { key: string; labelKey: TranslationKey; range: () => DateRange }[] = [
  { key: "7d", labelKey: "analytics.preset7d", range: () => ({ from: daysAgo(6), to: today() }) },
  { key: "30d", labelKey: "analytics.preset30d", range: () => ({ from: daysAgo(29), to: today() }) },
  { key: "90d", labelKey: "analytics.preset90d", range: () => ({ from: daysAgo(89), to: today() }) },
  { key: "mtd", labelKey: "analytics.presetMtd", range: () => ({ from: monthStart(), to: today() }) },
  { key: "all", labelKey: "analytics.presetAll", range: () => ({ from: "", to: "" }) },
];

/** Presets before a custom range, one row above the content it scopes — per the dataviz
 * skill's filter composition rule for monitoring dashboards. */
export function DateRangeFilter({ value, onChange }: { value: DateRange; onChange: (v: DateRange) => void }) {
  const { t } = useTranslation();
  const [customOpen, setCustomOpen] = useState(false);

  const activeKey = PRESETS.find((p) => {
    const r = p.range();
    return r.from === value.from && r.to === value.to;
  })?.key;

  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              onChange(p.range());
              setCustomOpen(false);
            }}
            className={`rounded-full border px-3 py-1 text-xs ${
              activeKey === p.key && !customOpen
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t(p.labelKey)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCustomOpen((s) => !s)}
          className={`rounded-full border px-3 py-1 text-xs ${
            customOpen ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {t("analytics.presetCustom")}
        </button>
      </div>

      {customOpen && (
        <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
          <label className="flex items-center gap-1 text-xs text-slate-500">
            {t("filters.from")}
            <input
              type="date"
              value={value.from}
              onChange={(e) => onChange({ ...value, from: e.target.value })}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-1 text-xs text-slate-500">
            {t("filters.to")}
            <input
              type="date"
              value={value.to}
              onChange={(e) => onChange({ ...value, to: e.target.value })}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </label>
        </div>
      )}
    </div>
  );
}
