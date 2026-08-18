"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ApiError } from "@/lib/api/client";
import {
  approveServiceRequest,
  cancelServiceRequest,
  exportRequestPdf,
  exportWarehouseCsv,
  getAuditLog,
  getServiceRequest,
  holdServiceRequest,
  receiveServiceRequest,
  rejectServiceRequest,
  requestCustomerAddressLink,
  resendConfirmation,
  resumeServiceRequest,
  reviseServiceRequest,
  submitServiceRequest,
  updateServiceRequest,
} from "@/lib/api/domain";
import { ItemRows } from "@/components/requests/ItemRows";
import { RequestFlowDiagram } from "@/components/requests/RequestFlowDiagram";
import { ShippingAddressFields } from "@/components/requests/ShippingAddressFields";
import { downloadBlob } from "@/lib/utils/download";
import { isAddressBlank } from "@/lib/utils/shippingAddress";
import { useOrigin } from "@/lib/hooks/useOrigin";
import { usePageTitle } from "@/lib/hooks/usePageTitle";
import { usePromptText } from "@/lib/confirm/ConfirmProvider";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import type { AuditLogEntry, RequestItemInput, ServiceRequest, ShippingAddress } from "@/lib/types/domain";

const WORKFLOW_ROLES = ["TECHNICIAN", "MANAGER", "WAREHOUSE", "ADMIN"];
const TERMINAL_STATUSES = ["CANCELLED", "WAREHOUSE_RECEIVED"];

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-50 text-blue-700",
  PENDING_MANAGER_APPROVAL: "bg-amber-50 text-amber-700",
  REJECTED: "bg-red-50 text-red-700",
  PENDING_CUSTOMER_CONFIRMATION: "bg-amber-50 text-amber-700",
  CUSTOMER_CONFIRMED: "bg-blue-50 text-blue-700",
  READY_TO_SHIP: "bg-emerald-50 text-emerald-700",
  ON_HOLD: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-slate-100 text-slate-400 line-through",
  WAREHOUSE_RECEIVED: "bg-emerald-100 text-emerald-800",
};

function StatusPill({ status }: { status: string }) {
  const { status: statusLabel } = useTranslation();
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"}`}>
      {statusLabel(status)}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-0.5 text-sm text-slate-900">{value || "—"}</p>
    </div>
  );
}

const CONFIRMATION_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

function ConfirmationLinkCard({
  token,
  status,
  canResend,
  onResend,
}: {
  token: string;
  status: string;
  canResend: boolean;
  onResend: () => void;
}) {
  const { t, confirmationStatus: confirmationStatusLabel } = useTranslation();
  const [copied, setCopied] = useState(false);
  const origin = useOrigin();
  const url = `${origin}/confirm/${token}`;

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{t("requestDetail.confirmationLinkHeading")}</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONFIRMATION_STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"}`}>
          {confirmationStatusLabel(status)}
        </span>
      </div>
      <p className="mb-3 break-all rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">{url}</p>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          {copied ? t("requestDetail.copied") : t("requestDetail.copyLink")}
        </button>
        {canResend && status === "PENDING" && (
          <button
            onClick={onResend}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            {t("requestDetail.resendLink")}
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-400">{t("requestDetail.confirmationLinkHint")}</p>
    </div>
  );
}

function Timeline({ entries }: { entries: AuditLogEntry[] }) {
  const { t, status: statusLabel, auditAction: auditActionLabel, role: roleLabel, formatDateTime } = useTranslation();
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">{t("requestDetail.noHistoryYet")}</p>;
  }
  return (
    <ol className="flex flex-col gap-4">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3 text-sm">
          <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
          <div>
            <p className="text-slate-900">
              <span className="font-medium">{entry.actorName}</span>
              {entry.actorRole && <span className="text-slate-500"> · {roleLabel(entry.actorRole)}</span>}
            </p>
            <p className="text-slate-700">
              {auditActionLabel(entry.action)}
              {entry.newStatus && entry.action !== "CREATED" && (
                <span className="text-slate-500"> → {statusLabel(entry.newStatus)}</span>
              )}
            </p>
            {entry.comment && <p className="text-slate-500 italic">&ldquo;{entry.comment}&rdquo;</p>}
            <p className="text-xs text-slate-400">{formatDateTime(entry.createdAt)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function EditModal({
  request,
  onClose,
  onSaved,
}: {
  request: ServiceRequest;
  onClose: () => void;
  onSaved: (updated: ServiceRequest) => void;
}) {
  const [itemCode, setItemCode] = useState(request.itemCode ?? "");
  const [model, setModel] = useState(request.model ?? "");
  const [serialNumber, setSerialNumber] = useState(request.serialNumber ?? "");
  const [reason, setReason] = useState(request.reason ?? "");
  const [items, setItems] = useState<RequestItemInput[]>(
    request.items.map((i) => ({ itemCode: i.itemCode ?? "", name: i.name, quantity: i.quantity, notes: i.notes ?? "" })),
  );
  const [address, setAddress] = useState<ShippingAddress>(
    request.shippingAddress ?? { line1: "", city: "", postalCode: "", country: "", contactName: "", contactPhone: "" },
  );
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateServiceRequest(request.id, {
        itemCode: request.requestType === "REPLACEMENT" ? itemCode || undefined : undefined,
        model: request.requestType === "REPLACEMENT" ? model || undefined : undefined,
        serialNumber,
        reason,
        items: request.requestType === "PARTS" ? items : undefined,
        shippingAddress: isAddressBlank(address) ? undefined : address,
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("requestDetail.errorSave"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 px-4 py-8">
      <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-lg">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">{t("requestDetail.editModalHeading", { number: request.requestNumber })}</h2>
        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex flex-col gap-4">
          {request.requestType === "REPLACEMENT" && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  {t("requestDetail.itemCodeLabel")}
                  <input
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  {t("requestDetail.modelLabel")}
                  <input
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </label>
              </div>
              <label className="text-sm font-medium text-slate-700">
                {t("requestDetail.serialNumberLabel")}
                <input
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
            </>
          )}

          {request.requestType === "PARTS" && (
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">{t("requestDetail.partsLabel")}</p>
              <ItemRows items={items} onChange={setItems} />
            </div>
          )}

          <label className="text-sm font-medium text-slate-700">
            {t("requestDetail.reasonLabel")}
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
          </label>

          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">{t("requestDetail.shippingAddressLabel")}</p>
            <ShippingAddressFields address={address} onChange={setAddress} />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function RequestDetail({ id }: { id: number }) {
  const { user } = useAuth();
  const promptText = usePromptText();
  const { t, requestType: requestTypeLabel, formatDateTime } = useTranslation();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  usePageTitle(request?.requestNumber ?? `Request ${id}`);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getServiceRequest(id), getAuditLog(id)])
      .then(([req, log]) => {
        if (cancelled) return;
        setRequest(req);
        setAuditLog(log);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t("requestDetail.errorLoad"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function refresh(updated: ServiceRequest) {
    setRequest(updated);
    getAuditLog(id).then(setAuditLog).catch(() => undefined);
  }

  async function runAction(action: () => Promise<ServiceRequest>) {
    setActionPending(true);
    setError(null);
    try {
      const updated = await action();
      refresh(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("requestDetail.errorAction"));
    } finally {
      setActionPending(false);
    }
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-slate-500">{t("common.loading")}</p>
      </main>
    );
  }

  if (!request) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-red-600">{error ?? t("requestDetail.notFound")}</p>
      </main>
    );
  }

  const isCreatorTechnician = user?.roles.includes("TECHNICIAN") && user.id === String(request.technicianId);
  const isAdmin = !!user?.roles.includes("ADMIN");
  const isManager = !!user?.roles.includes("MANAGER");
  const hasWorkflowRole = !!user && user.roles.some((r) => WORKFLOW_ROLES.includes(r));
  const isTerminal = TERMINAL_STATUSES.includes(request.status);

  const canEdit = request.status === "DRAFT" && (isAdmin || isCreatorTechnician);
  const canSubmit = request.status === "DRAFT" && (isAdmin || isCreatorTechnician);
  const canCancel = !isTerminal && hasWorkflowRole;
  const canHold = !isTerminal && request.status !== "DRAFT" && request.status !== "ON_HOLD" && hasWorkflowRole;
  const canResume = request.status === "ON_HOLD" && hasWorkflowRole;
  const canDecide = request.status === "PENDING_MANAGER_APPROVAL" && (isAdmin || isManager);
  const canRevise = request.status === "REJECTED" && (isAdmin || isCreatorTechnician);
  const canReceive = request.status === "READY_TO_SHIP" && (isAdmin || !!user?.roles.includes("WAREHOUSE"));

  async function handleCancel() {
    const reason = await promptText({
      title: t("requestDetail.cancelConfirmTitle"),
      message: t("requestDetail.reasonOptional"),
      placeholder: t("requestDetail.cancelPlaceholder"),
      confirmLabel: t("requestDetail.cancelConfirmButton"),
      danger: true,
    });
    if (reason === null) return; // dismissed — don't cancel the request
    await runAction(() => cancelServiceRequest(id, reason || undefined));
  }

  async function handleHold() {
    const reason = await promptText({
      title: t("requestDetail.holdConfirmTitle"),
      message: t("requestDetail.reasonOptional"),
      placeholder: t("requestDetail.holdPlaceholder"),
      confirmLabel: t("requestDetail.holdConfirmButton"),
    });
    if (reason === null) return;
    await runAction(() => holdServiceRequest(id, reason || undefined));
  }

  async function handleReject() {
    const reason = await promptText({
      title: t("requestDetail.rejectConfirmTitle"),
      message: t("requestDetail.rejectConfirmMessage"),
      placeholder: t("requestDetail.rejectPlaceholder"),
      required: true,
      confirmLabel: t("requestDetail.reject"),
      danger: true,
    });
    if (reason === null) return;
    await runAction(() => rejectServiceRequest(id, reason));
  }

  const reviseLabel = request.rejectionSource === "CUSTOMER" ? t("requestDetail.editAndResend") : t("requestDetail.revise");

  async function handleExportCsv() {
    if (!request) return;
    setExporting(true);
    setError(null);
    try {
      const blob = await exportWarehouseCsv([id]);
      downloadBlob(blob, `${request.requestNumber}.csv`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("requestDetail.errorExport"));
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPdf() {
    if (!request) return;
    setExportingPdf(true);
    setError(null);
    try {
      const blob = await exportRequestPdf(id);
      downloadBlob(blob, `${request.requestNumber}.pdf`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("requestDetail.errorExport"));
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href={`/tickets/${encodeURIComponent(request.zendeskTicketId)}`} className="text-xs text-slate-500 hover:underline">
            ← Ticket #{request.zendeskTicketId}
          </Link>
          <h1 className="mt-1 text-lg font-semibold text-slate-900">{request.requestNumber}</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={request.status} />
          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              disabled={actionPending}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {t("common.edit")}
            </button>
          )}
          {canRevise && (
            <button
              onClick={() => runAction(() => reviseServiceRequest(id))}
              disabled={actionPending}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {reviseLabel}
            </button>
          )}
          {canDecide && (
            <>
              <button
                onClick={handleReject}
                disabled={actionPending}
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {t("requestDetail.reject")}
              </button>
              <button
                onClick={() => runAction(() => approveServiceRequest(id))}
                disabled={actionPending}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {t("requestDetail.approve")}
              </button>
            </>
          )}
          {canReceive && (
            <button
              onClick={() => runAction(() => receiveServiceRequest(id))}
              disabled={actionPending}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {t("requestDetail.markReceived")}
            </button>
          )}
          {canResume && (
            <button
              onClick={() => runAction(() => resumeServiceRequest(id))}
              disabled={actionPending}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {t("requestDetail.resume")}
            </button>
          )}
          {canHold && (
            <button
              onClick={handleHold}
              disabled={actionPending}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {t("requestDetail.hold")}
            </button>
          )}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={actionPending}
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {t("requestDetail.cancel")}
            </button>
          )}
          {request.shippingAddress && (
            <>
              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {exportingPdf ? t("requestDetail.exportingPdf") : t("requestDetail.exportPdf")}
              </button>
              <button
                onClick={handleExportCsv}
                disabled={exporting}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {exporting ? t("requestDetail.exporting") : t("requestDetail.exportCsv")}
              </button>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <RequestFlowDiagram request={request} />

        <div className="mt-6 grid grid-cols-2 gap-6 rounded-lg border border-slate-200 bg-white p-5">
          <Field label={t("requestDetail.fieldRequestType")} value={requestTypeLabel(request.requestType)} />
          <Field label={t("requestDetail.fieldTechnician")} value={request.technicianName} />
          {request.requestType === "REPLACEMENT" && (
            <>
              <Field label={t("requestDetail.fieldItemCode")} value={request.itemCode} />
              <Field label={t("requestDetail.fieldModel")} value={request.model} />
              <Field label={t("requestDetail.fieldSerialNumber")} value={request.serialNumber} />
            </>
          )}
          <Field label={t("requestDetail.fieldReason")} value={request.reason} />
          <Field label={t("requestDetail.fieldCreated")} value={formatDateTime(request.createdAt)} />
        </div>

        {canSubmit && (
          <div className="mt-6 flex flex-col items-start gap-3 rounded-lg border-2 border-amber-300 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900">{t("requestDetail.draftSubmitPrompt")}</p>
              <p className="mt-0.5 text-xs text-amber-700">
                {request.requestType === "PARTS" && (!request.shippingAddress || isAddressBlank(request.shippingAddress))
                  ? t("requestDetail.draftSubmitHintPartsAddressMissing")
                  : t("requestDetail.draftSubmitHint")}
              </p>
            </div>
            <button
              onClick={() => runAction(() => submitServiceRequest(id))}
              disabled={actionPending}
              className="rounded-md bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
            >
              {t("requestDetail.submit")}
            </button>
          </div>
        )}

        {request.confirmationToken && request.confirmationStatus ? (
          <ConfirmationLinkCard
            token={request.confirmationToken}
            status={request.confirmationStatus}
            canResend={!!(isAdmin || isCreatorTechnician)}
            onResend={() => runAction(() => resendConfirmation(id))}
          />
        ) : request.requestType === "REPLACEMENT" ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
            {t("requestDetail.noConfirmationYet")}
          </div>
        ) : (
          request.requestType === "PARTS" && request.status === "DRAFT" && (isAdmin || isCreatorTechnician) && (
            <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">{t("requestDetail.customerAddressLinkHeading")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("requestDetail.customerAddressLinkHint")}</p>
              <button
                onClick={() => runAction(() => requestCustomerAddressLink(id))}
                disabled={actionPending}
                className="mt-3 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {t("requestDetail.generateAddressLink")}
              </button>
            </div>
          )
        )}

        {request.requestType === "PARTS" && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">{t("requestDetail.itemsHeading")}</h2>
            {request.items.length === 0 ? (
              <p className="text-sm text-slate-500">{t("requestDetail.noItemsYet")}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs tracking-wide text-slate-500 uppercase">
                    <th className="pb-2">{t("requestDetail.tableItemCode")}</th>
                    <th className="pb-2">{t("requestDetail.tableName")}</th>
                    <th className="pb-2">{t("requestDetail.tableQty")}</th>
                    <th className="pb-2">{t("requestDetail.tableNotes")}</th>
                  </tr>
                </thead>
                <tbody>
                  {request.items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="py-1.5">{item.itemCode}</td>
                      <td className="py-1.5">{item.name}</td>
                      <td className="py-1.5">{item.quantity}</td>
                      <td className="py-1.5 text-slate-500">{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {request.shippingAddress && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">{t("requestDetail.shippingAddressHeading")}</h2>
            {(request.shippingAddress.companyName || request.shippingAddress.vatNumber) && (
              <p className="text-sm text-slate-700">
                {request.shippingAddress.companyName}
                {request.shippingAddress.vatNumber && ` · ${t("requestDetail.vatLabel")} ${request.shippingAddress.vatNumber}`}
              </p>
            )}
            <p className="text-sm text-slate-700">
              {request.shippingAddress.line1}
              {request.shippingAddress.line2 && `, ${request.shippingAddress.line2}`}
              <br />
              {request.shippingAddress.postalCode} {request.shippingAddress.city}, {request.shippingAddress.country}
              <br />
              {request.shippingAddress.contactName} · {request.shippingAddress.contactPhone}
            </p>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">{t("requestDetail.timelineHeading")}</h2>
          <Timeline entries={auditLog} />
        </div>
      </main>

      {editing && (
        <EditModal
          request={request}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            refresh(updated);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RequestDetail id={Number(id)} />;
}
