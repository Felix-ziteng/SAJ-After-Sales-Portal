"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import type { DailyRequestCount } from "@/lib/types/domain";

const BLUE = "#2a78d6";
const BLUE_HOVER = "#1c5cab";
const WIDTH = 640;
const HEIGHT = 200;
const PADDING_LEFT = 30;
const PADDING_RIGHT = 8;
const PLOT_HEIGHT = 150;
const AXIS_LABEL_Y = PLOT_HEIGHT + 18;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/** Rounded top corners, square baseline — SVG `rect rx` rounds all four corners, which would
 * lift the bottom corners off a shared baseline, so this draws the path by hand instead. */
function topRoundedBarPath(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0) return "";
  const radius = Math.min(r, w / 2, h);
  return `M ${x} ${y + h} L ${x} ${y + radius} Q ${x} ${y} ${x + radius} ${y} L ${x + w - radius} ${y} Q ${x + w} ${y} ${x + w} ${y + radius} L ${x + w} ${y + h} Z`;
}

export function VolumeByDayChart({ data }: { data: DailyRequestCount[] }) {
  const { t } = useTranslation();
  const [showTable, setShowTable] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxCount = niceMax(Math.max(1, ...data.map((d) => d.count)));
  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxCount * f));

  const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const barSlot = data.length > 0 ? plotWidth / data.length : plotWidth;
  const barWidth = Math.min(24, Math.max(2, barSlot - 4));
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  function xFor(i: number) {
    return PADDING_LEFT + i * barSlot + (barSlot - barWidth) / 2;
  }
  function yFor(count: number) {
    return PLOT_HEIGHT - (count / maxCount) * PLOT_HEIGHT;
  }

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{t("analytics.requestsCreatedPerDay")}</h2>
        {data.length > 0 && (
          <button
            type="button"
            onClick={() => setShowTable((s) => !s)}
            className="text-xs text-slate-400 underline hover:text-slate-600"
          >
            {showTable ? t("analytics.showChart") : t("analytics.showTable")}
          </button>
        )}
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-slate-400">{t("analytics.noDataInRange")}</p>
      ) : showTable ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs tracking-wide text-slate-500 uppercase">
              <th className="pb-2">{t("analytics.date")}</th>
              <th className="pb-2 text-right">{t("analytics.requestsCreatedColumn")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date} className="border-b border-slate-100 last:border-0">
                <td className="py-1.5">{d.date}</td>
                <td className="py-1.5 text-right tabular-nums">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-auto w-full">
            {gridValues.map((g) => (
              <g key={g}>
                <line x1={PADDING_LEFT} x2={WIDTH} y1={yFor(g)} y2={yFor(g)} stroke="#e1e0d9" strokeWidth={1} />
                <text x={PADDING_LEFT - 6} y={yFor(g) + 3} textAnchor="end" fill="#898781" fontSize={9}>
                  {g}
                </text>
              </g>
            ))}
            <line x1={PADDING_LEFT} x2={WIDTH} y1={PLOT_HEIGHT} y2={PLOT_HEIGHT} stroke="#c3c2b7" strokeWidth={1} />

            {data.map((d, i) => {
              const barHeight = (d.count / maxCount) * PLOT_HEIGHT;
              const x = xFor(i);
              const y = PLOT_HEIGHT - barHeight;
              return (
                <g key={d.date}>
                  <path d={topRoundedBarPath(x, y, barWidth, barHeight, 4)} fill={hoverIndex === i ? BLUE_HOVER : BLUE} />
                  {i % labelEvery === 0 && (
                    <text x={x + barWidth / 2} y={AXIS_LABEL_Y} textAnchor="middle" fill="#898781" fontSize={9}>
                      {d.date.slice(5)}
                    </text>
                  )}
                  {/* Hit target spans the full column, not just the (often much shorter) bar. */}
                  <rect
                    x={PADDING_LEFT + i * barSlot}
                    y={0}
                    width={barSlot}
                    height={PLOT_HEIGHT}
                    fill="transparent"
                    tabIndex={0}
                    onMouseEnter={() => setHoverIndex(i)}
                    onMouseLeave={() => setHoverIndex(null)}
                    onFocus={() => setHoverIndex(i)}
                    onBlur={() => setHoverIndex(null)}
                  />
                </g>
              );
            })}
          </svg>

          {hovered && hoverIndex !== null && (
            <div
              className="pointer-events-none absolute rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md"
              style={{
                left: `${((xFor(hoverIndex) + barWidth / 2) / WIDTH) * 100}%`,
                top: `${(yFor(hovered.count) / HEIGHT) * 100}%`,
                transform: "translate(-50%, calc(-100% - 8px))",
              }}
            >
              <p className="font-medium text-slate-900">{hovered.count} {t("analytics.requestsSuffix")}</p>
              <p className="text-slate-500">{hovered.date}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
