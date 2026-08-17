"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/lib/auth/RequireRole";
import { ApiError } from "@/lib/api/client";
import { getRequestAnalytics } from "@/lib/api/domain";
import { usePageTitle } from "@/lib/hooks/usePageTitle";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { StatTile } from "@/components/analytics/StatTile";
import { HorizontalBarChart } from "@/components/analytics/HorizontalBarChart";
import { TypeSplitBar } from "@/components/analytics/TypeSplitBar";
import { VolumeByDayChart } from "@/components/analytics/VolumeByDayChart";
import { DateRangeFilter, type DateRange } from "@/components/analytics/DateRangeFilter";
import type { RequestAnalytics, RequestStatus } from "@/lib/types/domain";

const BLUE = "#2a78d6";

/** The 8 statuses a request can actually be stored as — same reachable set the Request Detail
 * flow diagram uses, in pipeline order rather than sorted by count, so a reader can see at a
 * glance where things are backed up. */
const STATUS_ORDER: RequestStatus[] = [
  "DRAFT",
  "PENDING_MANAGER_APPROVAL",
  "PENDING_CUSTOMER_CONFIRMATION",
  "READY_TO_SHIP",
  "WAREHOUSE_RECEIVED",
  "ON_HOLD",
  "REJECTED",
  "CANCELLED",
];

function toInstant(dateStr: string, endOfDay: boolean): string | undefined {
  if (!dateStr) return undefined;
  return `${dateStr}T${endOfDay ? "23:59:59" : "00:00:00"}Z`;
}

function AnalyticsDashboard() {
  const { t, status: statusLabel } = useTranslation();
  usePageTitle(t("analytics.title"));

  function formatTurnaround(days: number | null): string {
    if (days === null) return t("analytics.turnaroundEmpty");
    return t("analytics.turnaroundDays", { days: days.toFixed(1) });
  }

  const [range, setRange] = useState<DateRange>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  });
  const [data, setData] = useState<RequestAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRequestAnalytics(toInstant(range.from, false), toInstant(range.to, true))
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t("analytics.errorLoad"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{t("analytics.eyebrow")}</p>
        <h1 className="text-lg font-semibold text-slate-900">{t("analytics.title")}</h1>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <DateRangeFilter value={range} onChange={setRange} />

        {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {loading || !data ? (
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatTile label={t("analytics.totalRequests")} value={String(data.totalRequests)} />
              <StatTile label={t("analytics.open")} value={String(data.openRequests)} description={t("analytics.inProgress")} />
              <StatTile label={t("analytics.completed")} value={String(data.completedRequests)} description={t("analytics.warehouseReceivedDesc")} />
              <StatTile label={t("analytics.cancelled")} value={String(data.cancelledRequests)} />
              <StatTile
                label={t("analytics.avgTurnaround")}
                value={formatTurnaround(data.avgTurnaroundDays)}
                description={t("analytics.createdToReceived")}
              />
            </div>

            <div className="mt-6">
              <VolumeByDayChart data={data.volumeByDay} />
            </div>

            <div className="mt-6">
              <TypeSplitBar replacementCount={data.byType.REPLACEMENT ?? 0} partsCount={data.byType.PARTS ?? 0} />
            </div>

            <div className="mt-6">
              <HorizontalBarChart
                title={t("analytics.statusDistribution")}
                color={BLUE}
                items={STATUS_ORDER.map((status) => ({ label: statusLabel(status), value: data.byStatus[status] ?? 0 }))}
              />
            </div>

            <div className="mt-6">
              <HorizontalBarChart
                title={t("analytics.byTechnician")}
                color={BLUE}
                items={data.byTechnician.map((row) => ({ label: row.technicianName, value: row.count }))}
                emptyLabel={t("analytics.noRequestsInRange")}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <RequireRole role="ADMIN">
      <AnalyticsDashboard />
    </RequireRole>
  );
}
