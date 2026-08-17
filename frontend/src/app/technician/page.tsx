"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/lib/auth/RequireRole";
import { ApiError } from "@/lib/api/client";
import { searchServiceRequests } from "@/lib/api/domain";
import { ALL_STATUSES, filtersToSearchParams, RequestFilters, type RequestFilterState } from "@/components/requests/RequestFilters";
import { usePageTitle } from "@/lib/hooks/usePageTitle";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import type { RequestStatus, ServiceRequest } from "@/lib/types/domain";

const DEFAULT_STATUSES: RequestStatus[] = [
  "DRAFT",
  "PENDING_MANAGER_APPROVAL",
  "PENDING_CUSTOMER_CONFIRMATION",
  "READY_TO_SHIP",
];
const DEFAULT_FILTERS: RequestFilterState = { statuses: DEFAULT_STATUSES, requestTypes: [], from: "", to: "", ticketId: "" };

function CopyLinkButton({ token }: { token: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/confirm/${token}` : `/confirm/${token}`;

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
    >
      {copied ? t("technician.copied") : t("technician.copyLink")}
    </button>
  );
}

function RequestRow({ request }: { request: ServiceRequest }) {
  const { t, status: statusLabel, requestType: requestTypeLabel, formatDate } = useTranslation();
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/requests/${request.id}`} className="text-sm font-medium text-slate-900 hover:underline">
            {request.requestNumber}
          </Link>
          <p className="text-xs text-slate-500">
            {requestTypeLabel(request.requestType)}
            {" · "}
            {statusLabel(request.status)}
          </p>
          {request.productName && <p className="mt-1 text-sm text-slate-700">{t("common.product")}: {request.productName}</p>}
          {request.reason && <p className="mt-1 text-sm text-slate-500">{t("requestDetail.reasonLabel")}: {request.reason}</p>}
          <p className="mt-1 text-xs text-slate-400">
            {t("common.technicianCreatedLine", { name: request.technicianName, date: formatDate(request.createdAt) })}
          </p>
        </div>
        {request.confirmationToken && <CopyLinkButton token={request.confirmationToken} />}
      </div>
    </div>
  );
}

function TechnicianDashboard() {
  const { t } = useTranslation();
  usePageTitle(t("nav.requests"));
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filters, setFilters] = usePersistedState<RequestFilterState>("filters:technician", DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    searchServiceRequests(filtersToSearchParams(filters))
      .then((data) => {
        if (!cancelled) setRequests(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t("technician.errorLoad"));
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
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{t("technician.eyebrow")}</p>
        <h1 className="text-lg font-semibold text-slate-900">{t("technician.title")}</h1>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <RequestFilters value={filters} onChange={setFilters} statusOptions={ALL_STATUSES} />

        {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {loading ? (
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        ) : requests.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            {t("technician.noMatch")}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
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
    <RequireRole role={["TECHNICIAN", "ADMIN"]}>
      <TechnicianDashboard />
    </RequireRole>
  );
}
