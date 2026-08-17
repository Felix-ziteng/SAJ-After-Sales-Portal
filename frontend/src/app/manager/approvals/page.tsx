"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/lib/auth/RequireRole";
import { ApiError } from "@/lib/api/client";
import { approveBatch, approveServiceRequest, rejectServiceRequest, searchServiceRequests } from "@/lib/api/domain";
import { EMPTY_FILTERS, filtersToSearchParams, RequestFilters, type RequestFilterState } from "@/components/requests/RequestFilters";
import { usePageTitle } from "@/lib/hooks/usePageTitle";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import { usePromptText } from "@/lib/confirm/ConfirmProvider";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import type { ServiceRequest } from "@/lib/types/domain";

function ApprovalRow({
  request,
  selected,
  onToggleSelected,
  onDecided,
}: {
  request: ServiceRequest;
  selected: boolean;
  onToggleSelected: (id: number) => void;
  onDecided: (id: number) => void;
}) {
  const { t, status: statusLabel, requestType: requestTypeLabel, formatDate } = useTranslation();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const promptText = usePromptText();

  async function handleApprove() {
    setPending(true);
    setError(null);
    try {
      await approveServiceRequest(request.id);
      onDecided(request.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("managerApprovals.errorApprove"));
    } finally {
      setPending(false);
    }
  }

  async function handleReject() {
    const reason = await promptText({
      title: t("managerApprovals.rejectConfirmTitle"),
      message: t("managerApprovals.rejectConfirmMessage"),
      placeholder: t("managerApprovals.rejectPlaceholder"),
      required: true,
      confirmLabel: t("managerApprovals.reject"),
      danger: true,
    });
    if (reason === null) return;
    setPending(true);
    setError(null);
    try {
      await rejectServiceRequest(request.id, reason);
      onDecided(request.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("managerApprovals.errorReject"));
    } finally {
      setPending(false);
    }
  }

  const isPendingApproval = request.status === "PENDING_MANAGER_APPROVAL";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          {isPendingApproval && (
            <input type="checkbox" checked={selected} onChange={() => onToggleSelected(request.id)} className="mt-1" />
          )}
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
            {request.serialNumber && <p className="text-sm text-slate-700">{t("requestDetail.serialNumberLabel")}: {request.serialNumber}</p>}
            {request.reason && <p className="mt-1 text-sm text-slate-500">{t("requestDetail.reasonLabel")}: {request.reason}</p>}
            <p className="mt-1 text-xs text-slate-400">
              {t("common.technicianCreatedLine", { name: request.technicianName, date: formatDate(request.createdAt) })}
            </p>
          </div>
        </div>
        {isPendingApproval && (
          <div className="flex flex-shrink-0 gap-2">
            <button
              onClick={handleReject}
              disabled={pending}
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {t("managerApprovals.reject")}
            </button>
            <button
              onClick={handleApprove}
              disabled={pending}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {t("managerApprovals.approve")}
            </button>
          </div>
        )}
      </div>
      {error && <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

function ManagerApprovals() {
  const { t } = useTranslation();
  usePageTitle(t("nav.approvals"));
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filters, setFilters] = usePersistedState<RequestFilterState>("filters:manager-approvals", EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batchPending, setBatchPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    searchServiceRequests(filtersToSearchParams(filters))
      .then((data) => {
        if (!cancelled) setRequests(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t("managerApprovals.errorLoad"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, t]);

  function handleDecided(id: number) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" } : r)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleSelected(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const approvableIds = requests.filter((r) => r.status === "PENDING_MANAGER_APPROVAL").map((r) => r.id);

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === approvableIds.length ? new Set() : new Set(approvableIds)));
  }

  async function handleBatchApprove() {
    setBatchPending(true);
    setError(null);
    try {
      await approveBatch(Array.from(selectedIds));
      const ids = selectedIds;
      const updated = await searchServiceRequests(filtersToSearchParams(filters));
      setRequests(updated);
      setSelectedIds((prev) => new Set(Array.from(prev).filter((id) => !ids.has(id))));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("managerApprovals.errorBatchApprove"));
    } finally {
      setBatchPending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{t("managerApprovals.eyebrow")}</p>
        <h1 className="text-lg font-semibold text-slate-900">{t("managerApprovals.title")}</h1>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <RequestFilters value={filters} onChange={setFilters} />

        {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {loading ? (
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        ) : requests.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            {t("managerApprovals.noMatch")}
          </p>
        ) : (
          <>
            {approvableIds.length > 0 && (
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={selectedIds.size === approvableIds.length} onChange={toggleSelectAll} />
                  {t("managerApprovals.selectAllPending", { count: approvableIds.length })}
                </label>
                <button
                  onClick={handleBatchApprove}
                  disabled={selectedIds.size === 0 || batchPending}
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {batchPending ? t("managerApprovals.approving") : t("managerApprovals.approveSelected", { count: selectedIds.size })}
                </button>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {requests.map((r) => (
                <ApprovalRow
                  key={r.id}
                  request={r}
                  selected={selectedIds.has(r.id)}
                  onToggleSelected={toggleSelected}
                  onDecided={handleDecided}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <RequireRole role={["MANAGER", "ADMIN"]}>
      <ManagerApprovals />
    </RequireRole>
  );
}
