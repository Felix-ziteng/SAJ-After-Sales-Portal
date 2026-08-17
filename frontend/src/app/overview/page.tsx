"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/lib/auth/RequireRole";
import { ApiError } from "@/lib/api/client";
import { searchServiceRequests } from "@/lib/api/domain";
import { ALL_STATUSES, EMPTY_FILTERS, filtersToSearchParams, RequestFilters, type RequestFilterState } from "@/components/requests/RequestFilters";
import { usePageTitle } from "@/lib/hooks/usePageTitle";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import type { ServiceRequest } from "@/lib/types/domain";

function RequestRow({ request }: { request: ServiceRequest }) {
  const { status: statusLabel, requestType: requestTypeLabel } = useTranslation();
  return (
    <Link
      href={`/requests/${request.id}`}
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300 hover:bg-slate-50"
    >
      <div>
        <p className="text-sm font-medium text-slate-900">{request.requestNumber}</p>
        <p className="text-xs text-slate-500">
          Ticket #{request.zendeskTicketId} · {requestTypeLabel(request.requestType)}
          {" · "}
          {request.technicianName}
        </p>
      </div>
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
        {statusLabel(request.status)}
      </span>
    </Link>
  );
}

/** Read-only overview across every request — for the four operational roles, a broader view than
 * their own default filtered queue. Guest (VIEWER) does NOT get this: that role is deliberately
 * scoped to looking up one ticket at a time, not browsing/searching everything (see
 * RequireRole below and the matching backend restriction on GET /api/requests). No action
 * buttons here; click through to the Request Detail page for those. */
function Overview() {
  const { t } = useTranslation();
  usePageTitle(t("overview.title"));
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filters, setFilters] = usePersistedState<RequestFilterState>("filters:overview", EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    searchServiceRequests(filtersToSearchParams(filters))
      .then((data) => {
        if (!cancelled) setRequests(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t("overview.errorLoad"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, t]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{t("overview.eyebrow")}</p>
        <h1 className="text-lg font-semibold text-slate-900">{t("overview.title")}</h1>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <RequestFilters value={filters} onChange={setFilters} statusOptions={ALL_STATUSES} />

        {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {loading ? (
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        ) : requests.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            {t("overview.noMatch")}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {requests.map((r) => (
              <RequestRow key={r.id} request={r} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <RequireRole role={["TECHNICIAN", "MANAGER", "WAREHOUSE", "ADMIN"]}>
      <Overview />
    </RequireRole>
  );
}
