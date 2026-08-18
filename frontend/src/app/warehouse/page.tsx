"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/lib/auth/RequireRole";
import { ApiError } from "@/lib/api/client";
import { exportWarehouseCsv, receiveBatch, receiveServiceRequest, searchServiceRequests } from "@/lib/api/domain";
import { downloadBlob } from "@/lib/utils/download";
import { filtersToSearchParams, RequestFilters, type RequestFilterState } from "@/components/requests/RequestFilters";
import { usePageTitle } from "@/lib/hooks/usePageTitle";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import type { RequestStatus, ServiceRequest } from "@/lib/types/domain";

const WAREHOUSE_STATUSES: RequestStatus[] = ["READY_TO_SHIP", "WAREHOUSE_RECEIVED"];
const DEFAULT_FILTERS: RequestFilterState = { statuses: WAREHOUSE_STATUSES, requestTypes: [], from: "", to: "", ticketId: "" };

function QueueRow({
  request,
  selected,
  onToggleSelected,
  onReceived,
}: {
  request: ServiceRequest;
  selected: boolean;
  onToggleSelected: (id: number) => void;
  onReceived: (id: number) => void;
}) {
  const { t, status: statusLabel, requestType: requestTypeLabel, formatDate } = useTranslation();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReceive() {
    setPending(true);
    setError(null);
    try {
      await receiveServiceRequest(request.id);
      onReceived(request.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("warehouse.errorReceive"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelected(request.id)}
            className="mt-1"
          />
          <div>
            <Link href={`/requests/${request.id}`} className="text-sm font-medium text-slate-900 hover:underline">
              {request.requestNumber}
            </Link>
            <p className="text-xs text-slate-500">
              {requestTypeLabel(request.requestType)}
              {" · "}
              {statusLabel(request.status)}
              {request.shippingAddress?.companyName && ` · ${request.shippingAddress.companyName}`}
            </p>
            {request.model && <p className="mt-1 text-sm text-slate-700">{t("common.product")}: {request.model}</p>}
            {request.shippingAddress && (
              <p className="mt-1 text-sm text-slate-600">
                {request.shippingAddress.line1}, {request.shippingAddress.postalCode} {request.shippingAddress.city},{" "}
                {request.shippingAddress.country}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              {t("common.technicianCreatedLine", { name: request.technicianName, date: formatDate(request.createdAt) })}
            </p>
          </div>
        </div>
        {request.status === "READY_TO_SHIP" && (
          <button
            onClick={handleReceive}
            disabled={pending}
            className="flex-shrink-0 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {t("warehouse.markReceived")}
          </button>
        )}
      </div>
      {error && <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

function WarehouseQueue() {
  const { t, status: statusLabel } = useTranslation();
  usePageTitle(t("nav.warehouse"));
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filters, setFilters] = usePersistedState<RequestFilterState>("filters:warehouse", DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batchPending, setBatchPending] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    searchServiceRequests(filtersToSearchParams(filters))
      .then((data) => {
        if (!cancelled) setRequests(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t("warehouse.errorLoad"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, t]);

  function handleReceived(id: number) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
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

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === requests.length ? new Set() : new Set(requests.map((r) => r.id))));
  }

  const selectedReceivable =
    selectedIds.size > 0 &&
    requests.filter((r) => selectedIds.has(r.id)).every((r) => r.status === "READY_TO_SHIP");

  async function handleBatchReceive() {
    setBatchPending(true);
    setError(null);
    try {
      await receiveBatch(Array.from(selectedIds));
      const ids = selectedIds;
      setRequests((prev) => prev.filter((r) => !ids.has(r.id)));
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("warehouse.errorBatchReceive"));
    } finally {
      setBatchPending(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const blob = await exportWarehouseCsv(Array.from(selectedIds));
      downloadBlob(blob, "warehouse-export.csv");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("warehouse.errorExport"));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{t("warehouse.eyebrow")}</p>
        <h1 className="text-lg font-semibold text-slate-900">{t("warehouse.title")}</h1>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <RequestFilters value={filters} onChange={setFilters} statusOptions={WAREHOUSE_STATUSES} />

        {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {loading ? (
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        ) : requests.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            {t("warehouse.noMatch")}
          </p>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={selectedIds.size === requests.length}
                  onChange={toggleSelectAll}
                />
                {t("warehouse.selectAll", { count: requests.length })}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  disabled={selectedIds.size === 0 || exporting}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  {exporting ? t("warehouse.exporting") : t("warehouse.exportCsv")}
                </button>
                <button
                  onClick={handleBatchReceive}
                  disabled={!selectedReceivable || batchPending}
                  title={
                    selectedIds.size > 0 && !selectedReceivable
                      ? t("warehouse.onlyReadyToShipHint", { status: statusLabel("READY_TO_SHIP") })
                      : undefined
                  }
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {batchPending ? t("warehouse.marking") : t("warehouse.markSelectedReceived", { count: selectedIds.size })}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {requests.map((r) => (
                <QueueRow
                  key={r.id}
                  request={r}
                  selected={selectedIds.has(r.id)}
                  onToggleSelected={toggleSelected}
                  onReceived={handleReceived}
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
    <RequireRole role={["WAREHOUSE", "ADMIN"]}>
      <WarehouseQueue />
    </RequireRole>
  );
}
