"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export interface BarItem {
  label: string;
  value: number;
}

/** Compare-magnitude bars — one series (a single count per category), so every bar takes the
 * same hue per the color formula (nominal categorical with one series = no legend needed, the
 * card title already says what's plotted). Direct-labeled at the tip, so the value never hides
 * behind hover; the table toggle is the accessibility twin required for every chart. */
export function HorizontalBarChart({
  title,
  items,
  color,
  emptyLabel,
}: {
  title: string;
  items: BarItem[];
  color: string;
  emptyLabel?: string;
}) {
  const { t } = useTranslation();
  const [showTable, setShowTable] = useState(false);
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setShowTable((s) => !s)}
            className="text-xs text-slate-400 underline hover:text-slate-600"
          >
            {showTable ? t("analytics.showChart") : t("analytics.showTable")}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400">{emptyLabel ?? t("analytics.noDataInRange")}</p>
      ) : showTable ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs tracking-wide text-slate-500 uppercase">
              <th className="pb-2">{t("analytics.label")}</th>
              <th className="pb-2 text-right">{t("analytics.count")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.label} className="border-b border-slate-100 last:border-0">
                <td className="py-1.5">{item.label}</td>
                <td className="py-1.5 text-right tabular-nums">{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <p className="w-36 flex-shrink-0 text-xs leading-tight text-slate-600">{item.label}</p>
              <div className="h-4 flex-1 rounded-sm bg-slate-100">
                <div
                  className="h-4 rounded-sm transition-[width]"
                  style={{ width: `${(item.value / max) * 100}%`, backgroundColor: color }}
                />
              </div>
              <p className="w-8 flex-shrink-0 text-right text-xs font-medium tabular-nums text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
