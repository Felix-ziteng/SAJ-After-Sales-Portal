import { useTranslation } from "@/lib/i18n/LocaleProvider";
import type { RequestStatus, RequestTypeCode } from "@/lib/types/domain";

export const ALL_STATUSES: RequestStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "PENDING_MANAGER_APPROVAL",
  "REJECTED",
  "PENDING_CUSTOMER_CONFIRMATION",
  "CUSTOMER_CONFIRMED",
  "READY_TO_SHIP",
  "ON_HOLD",
  "CANCELLED",
  "WAREHOUSE_RECEIVED",
];

export const ALL_REQUEST_TYPES: RequestTypeCode[] = ["REPLACEMENT", "PARTS"];

export interface RequestFilterState {
  statuses: RequestStatus[];
  requestTypes: RequestTypeCode[];
  from: string;
  to: string;
  ticketId: string;
}

export const EMPTY_FILTERS: RequestFilterState = { statuses: [], requestTypes: [], from: "", to: "", ticketId: "" };

/** `<input type="date">` gives a bare yyyy-mm-dd — widen to the full day in UTC so "to" is
 * inclusive of everything that happened on that date. */
export function filtersToSearchParams(filters: RequestFilterState) {
  return {
    status: filters.statuses.length > 0 ? filters.statuses : undefined,
    requestType: filters.requestTypes.length > 0 ? filters.requestTypes : undefined,
    from: filters.from ? `${filters.from}T00:00:00Z` : undefined,
    to: filters.to ? `${filters.to}T23:59:59Z` : undefined,
    ticketId: filters.ticketId.trim() || undefined,
  };
}

export function RequestFilters({
  value,
  onChange,
  statusOptions = ALL_STATUSES,
}: {
  value: RequestFilterState;
  onChange: (v: RequestFilterState) => void;
  /** Which status chips to offer — a role's dashboard only needs the statuses it actually acts
   * on, not the full lifecycle (e.g. Warehouse has no use for DRAFT or PENDING_MANAGER_APPROVAL). */
  statusOptions?: RequestStatus[];
}) {
  const { t, status: statusLabel, requestType: requestTypeLabel } = useTranslation();

  function toggleStatus(status: RequestStatus) {
    const statuses = value.statuses.includes(status)
      ? value.statuses.filter((s) => s !== status)
      : [...value.statuses, status];
    onChange({ ...value, statuses });
  }

  function toggleRequestType(type: RequestTypeCode) {
    const requestTypes = value.requestTypes.includes(type)
      ? value.requestTypes.filter((t) => t !== type)
      : [...value.requestTypes, type];
    onChange({ ...value, requestTypes });
  }

  const hasFilters =
    value.from || value.to || value.statuses.length > 0 || value.requestTypes.length > 0 || value.ticketId;

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1 text-xs text-slate-500">
          {t("filters.ticketNumber")}
          <input
            type="text"
            value={value.ticketId}
            onChange={(e) => onChange({ ...value, ticketId: e.target.value })}
            placeholder={t("filters.ticketPlaceholder")}
            className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
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
        {hasFilters && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-xs text-slate-400 underline hover:text-slate-600"
          >
            {t("filters.clear")}
          </button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {ALL_REQUEST_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => toggleRequestType(type)}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              value.requestTypes.includes(type)
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {requestTypeLabel(type)}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {statusOptions.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => toggleStatus(status)}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              value.statuses.includes(status)
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {statusLabel(status)}
          </button>
        ))}
      </div>
    </div>
  );
}
