"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ApiError } from "@/lib/api/client";
import { createTicket, getTicket, listRequestsForTicket } from "@/lib/api/domain";
import { usePageTitle } from "@/lib/hooks/usePageTitle";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import type { CreateTicketRequest, ServiceRequest, Ticket } from "@/lib/types/domain";

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

function CreateTicketForm({ ticketId, onCreated }: { ticketId: string; onCreated: () => void }) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body: CreateTicketRequest = { zendeskTicketId: ticketId, subject, requesterEmail };
      await createTicket(body);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("ticketWorkspace.errorCreateTicket"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{t("ticketWorkspace.noReferenceYet")}</p>
      <h1 className="mt-1 text-xl font-semibold text-slate-900">{t("ticketWorkspace.createReferenceTitle", { id: ticketId })}</h1>
      <p className="mt-2 text-sm text-slate-500">{t("ticketWorkspace.createReferenceHint")}</p>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-700">
          {t("ticketWorkspace.subjectLabel")}
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          {t("ticketWorkspace.requesterEmailLabel")}
          <input
            type="email"
            value={requesterEmail}
            onChange={(e) => setRequesterEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? t("common.creating") : t("ticketWorkspace.createTicketButton")}
        </button>
      </form>
    </main>
  );
}

function RequestRow({ request }: { request: ServiceRequest }) {
  const { requestType: requestTypeLabel } = useTranslation();
  return (
    <Link
      href={`/requests/${request.id}`}
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300 hover:bg-slate-50"
    >
      <div>
        <p className="text-sm font-medium text-slate-900">{request.requestNumber}</p>
        <p className="text-xs text-slate-500">
          {requestTypeLabel(request.requestType)} ·{" "}
          {request.technicianName}
        </p>
      </div>
      <StatusPill status={request.status} />
    </Link>
  );
}

function TicketWorkspace({ ticketId }: { ticketId: string }) {
  const { t } = useTranslation();
  usePageTitle(`Ticket #${ticketId}`);
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getTicket(ticketId)
      .then(async (t) => {
        if (cancelled) return;
        setTicket(t);
        setNotFound(false);
        const reqs = await listRequestsForTicket(ticketId);
        if (!cancelled) setRequests(reqs);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof ApiError ? err.message : t("ticketWorkspace.errorLoad"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, reloadToken]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-slate-500">{t("common.loading")}</p>
      </main>
    );
  }

  if (notFound) {
    return <CreateTicketForm ticketId={ticketId} onCreated={() => setReloadToken((n) => n + 1)} />;
  }

  if (error || !ticket) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-red-600">{error ?? t("ticketWorkspace.errorGeneric")}</p>
      </main>
    );
  }

  const canCreate = user?.roles.includes("TECHNICIAN") || user?.roles.includes("ADMIN");

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{t("ticketWorkspace.zendeskTicketEyebrow", { id: ticket.zendeskTicketId })}</p>
        <h1 className="text-lg font-semibold text-slate-900">{ticket.subject || t("ticketWorkspace.noSubject")}</h1>
        {ticket.requesterEmail && <p className="text-sm text-slate-500">{ticket.requesterEmail}</p>}
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">{t("ticketWorkspace.serviceRequestsHeading")}</h2>
          {canCreate && (
            <Link
              href={`/requests/new?ticketId=${encodeURIComponent(ticket.zendeskTicketId)}`}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
            >
              {t("ticketWorkspace.createNewRequest")}
            </Link>
          )}
        </div>

        {requests.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            {t("ticketWorkspace.noRequestsYet")}
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

export default function Page({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = use(params);
  return <TicketWorkspace ticketId={decodeURIComponent(ticketId)} />;
}
