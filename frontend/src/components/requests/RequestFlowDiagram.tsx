import { useTranslation } from "@/lib/i18n/LocaleProvider";
import type { RequestStatus, ServiceRequest } from "@/lib/types/domain";

/** The two type-dependent "happy paths" through the workflow — a Parts request never needs
 * Manager Approval or Customer Confirmation, so it skips straight from Draft to the warehouse
 * gate. Deliberately only the 8 statuses a request can actually be *stored* as: SUBMITTED and
 * CUSTOMER_CONFIRMED are declared on the backend enum but the workflow engine cascades straight
 * through them in the same transition, so they never sit on a row as `status` and don't belong
 * on a "where is this request right now" track. */
const REPLACEMENT_TRACK: RequestStatus[] = [
  "DRAFT",
  "PENDING_MANAGER_APPROVAL",
  "PENDING_CUSTOMER_CONFIRMATION",
  "READY_TO_SHIP",
  "WAREHOUSE_RECEIVED",
];
const PARTS_TRACK: RequestStatus[] = ["DRAFT", "READY_TO_SHIP", "WAREHOUSE_RECEIVED"];

export function RequestFlowDiagram({ request }: { request: ServiceRequest }) {
  const { t, status: statusLabel } = useTranslation();
  const track = request.requestType === "REPLACEMENT" ? REPLACEMENT_TRACK : PARTS_TRACK;

  const isCancelled = request.status === "CANCELLED";
  const isRejected = request.status === "REJECTED";
  const isOnHold = request.status === "ON_HOLD";

  // REJECTED/ON_HOLD aren't points on the main track — they're a detour from one. Show the track
  // frozen at the step it detoured from, with a badge underneath explaining the detour.
  let trackStatus: RequestStatus = request.status;
  if (isRejected) {
    trackStatus = request.rejectionSource === "CUSTOMER" ? "PENDING_CUSTOMER_CONFIRMATION" : "PENDING_MANAGER_APPROVAL";
  } else if (isOnHold && request.heldFromStatus) {
    trackStatus = request.heldFromStatus;
  }
  const currentIndex = track.indexOf(trackStatus);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{t("requestDetail.processStatus")}</h2>
      <div className={`flex items-start ${isCancelled ? "opacity-40" : ""}`}>
        {track.map((step, i) => {
          const done = !isCancelled && i < currentIndex;
          const current = !isCancelled && i === currentIndex;
          const circleStyle = done
            ? "bg-emerald-600 text-white"
            : current
              ? isRejected
                ? "bg-red-600 text-white"
                : isOnHold
                  ? "bg-amber-500 text-white"
                  : "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-400";

          return (
            <div key={step} className="flex flex-1 items-start last:flex-none">
              <div className="flex w-24 flex-col items-center">
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${circleStyle}`}>
                  {done ? "✓" : i + 1}
                </div>
                <p className={`mt-2 text-center text-[11px] leading-tight ${current ? "font-semibold text-slate-900" : "text-slate-500"}`}>
                  {statusLabel(step)}
                </p>
              </div>
              {i < track.length - 1 && (
                <div className={`mt-4 h-0.5 flex-1 ${done ? "bg-emerald-600" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {isRejected && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {request.rejectionSource === "CUSTOMER"
            ? t("requestDetail.rejectedByCustomer")
            : t("requestDetail.rejectedByManager")}
        </p>
      )}
      {isOnHold && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {request.heldFromStatus
            ? t("requestDetail.onHoldAt", { status: statusLabel(request.heldFromStatus) })
            : t("requestDetail.onHold")}
        </p>
      )}
      {isCancelled && (
        <p className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
          {t("requestDetail.cancelledNotice")}
        </p>
      )}
    </div>
  );
}
