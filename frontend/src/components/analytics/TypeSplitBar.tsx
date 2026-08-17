import { useTranslation } from "@/lib/i18n/LocaleProvider";

/** Part-to-whole with exactly 2 categories → a single 100%-stacked bar. Two series means a
 * legend is mandatory (never rely on color-matching alone) — each segment also carries its own
 * direct label since there's room. Categorical slots 1 (blue) and 2 (orange) from the validated
 * default palette, adjacent-pair CVD checked. */
export function TypeSplitBar({ replacementCount, partsCount }: { replacementCount: number; partsCount: number }) {
  const { t, requestType: requestTypeLabel } = useTranslation();
  const total = replacementCount + partsCount;
  const replacementPct = total === 0 ? 0 : (replacementCount / total) * 100;
  const partsPct = total === 0 ? 0 : (partsCount / total) * 100;
  const BLUE = "#2a78d6";
  const ORANGE = "#eb6834";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{t("analytics.requestTypeSplit")}</h2>

      {total === 0 ? (
        <p className="text-sm text-slate-400">{t("analytics.noDataInRange")}</p>
      ) : (
        <>
          <div className="flex h-6 w-full overflow-hidden rounded-sm bg-slate-100">
            {replacementCount > 0 && (
              <div style={{ width: `${replacementPct}%`, backgroundColor: BLUE }} className="h-6" />
            )}
            {replacementCount > 0 && partsCount > 0 && <div className="h-6 w-0.5 flex-shrink-0 bg-white" />}
            {partsCount > 0 && <div style={{ width: `${partsPct}%`, backgroundColor: ORANGE }} className="h-6" />}
          </div>
          <div className="mt-4 flex gap-6">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: BLUE }} />
              <p className="text-xs text-slate-600">
                {requestTypeLabel("REPLACEMENT")} — <span className="font-medium text-slate-900">{replacementCount}</span>{" "}
                ({replacementPct.toFixed(0)}%)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: ORANGE }} />
              <p className="text-xs text-slate-600">
                {requestTypeLabel("PARTS")} — <span className="font-medium text-slate-900">{partsCount}</span> ({partsPct.toFixed(0)}%)
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
