"use client";

import { use, useEffect, useState } from "react";
import { ConfirmApiError, confirmRequest, getConfirmation, rejectRequest } from "@/lib/api/confirm";
import { ShippingAddressFields } from "@/components/requests/ShippingAddressFields";
import { usePageTitle } from "@/lib/hooks/usePageTitle";
import { usePromptText } from "@/lib/confirm/ConfirmProvider";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { CustomerConfirmationView } from "@/lib/types/confirmation";
import type { ShippingAddress } from "@/lib/types/domain";

const EMPTY_ADDRESS: ShippingAddress = {
  line1: "",
  city: "",
  postalCode: "",
  country: "",
  contactName: "",
  contactPhone: "",
  companyName: "",
  vatNumber: "",
};

function RequestSummary({ view }: { view: CustomerConfirmationView }) {
  const { t, requestType: requestTypeLabel } = useTranslation();
  return (
    <div className="mb-6 rounded-lg bg-slate-50 p-4 text-sm">
      <p className="font-medium text-slate-900">{view.requestNumber}</p>
      <p className="text-slate-600">{requestTypeLabel(view.requestType)}</p>
      <p className="text-slate-600">{t("confirmPage.ticketPrefix", { id: view.zendeskTicketId })}</p>
      {view.model && <p className="text-slate-600">{t("confirmPage.replacementPrefix", { name: view.model })}</p>}
    </div>
  );
}

function DecidedView({ view }: { view: CustomerConfirmationView }) {
  const { t, formatDateTime } = useTranslation();
  const confirmed = view.status === "CONFIRMED";
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-4 flex justify-end">
        <LanguageSwitcher />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <RequestSummary view={view} />
        <div className={`rounded-md px-4 py-3 text-sm ${confirmed ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          <p className="font-medium">{confirmed ? t("confirmPage.alreadyConfirmed") : t("confirmPage.alreadyRejected")}</p>
          <p className="mt-1 text-xs opacity-80">
            {view.decidedAt && formatDateTime(view.decidedAt)}
          </p>
        </div>

        {confirmed && view.shippingAddress && (
          <div className="mt-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">{t("confirmPage.shippingAddressOnFile")}</p>
            {(view.shippingAddress.companyName || view.shippingAddress.vatNumber) && (
              <p className="mt-1">
                {view.shippingAddress.companyName}
                {view.shippingAddress.vatNumber && ` · ${t("confirmPage.vatLabel")} ${view.shippingAddress.vatNumber}`}
              </p>
            )}
            <p className="mt-1">
              {view.shippingAddress.line1}
              {view.shippingAddress.line2 && `, ${view.shippingAddress.line2}`}
              <br />
              {view.shippingAddress.postalCode} {view.shippingAddress.city}, {view.shippingAddress.country}
              <br />
              {view.shippingAddress.contactName} · {view.shippingAddress.contactPhone}
            </p>
            <p className="mt-2 text-xs text-slate-500">{t("common.signedBy", { name: view.signatureName ?? "" })}</p>
          </div>
        )}

        {!confirmed && view.rejectionReason && (
          <p className="mt-4 text-sm text-slate-700">
            <span className="font-medium text-slate-900">{t("confirmPage.reasonLabel")} </span>
            {view.rejectionReason}
          </p>
        )}

        <p className="mt-6 text-xs text-slate-400">{t("confirmPage.outcomeHint")}</p>
      </div>
    </main>
  );
}

function PendingForm({ token, view, onDecided }: { token: string; view: CustomerConfirmationView; onDecided: (v: CustomerConfirmationView) => void }) {
  const { t } = useTranslation();
  const [address, setAddress] = useState<ShippingAddress>(view.shippingAddress ?? EMPTY_ADDRESS);
  const [signatureName, setSignatureName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const promptText = usePromptText();

  const canSubmit =
    agreed &&
    signatureName.trim().length > 0 &&
    address.line1 && address.city && address.postalCode && address.country && address.contactName && address.contactPhone &&
    address.vatNumber;

  function handleUsePrevious() {
    if (view.previousInfo) {
      setAddress(view.previousInfo);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await confirmRequest(token, { signatureName, shippingAddress: address });
      onDecided(updated);
    } catch (err) {
      setError(err instanceof ConfirmApiError ? err.message : t("confirmPage.errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    const reason = await promptText({
      title: t("confirmPage.rejectConfirmTitle"),
      message: t("confirmPage.rejectConfirmMessage"),
      placeholder: t("confirmPage.rejectPlaceholder"),
      required: true,
      confirmLabel: t("confirmPage.reject"),
      danger: true,
    });
    if (reason === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await rejectRequest(token, reason);
      onDecided(updated);
    } catch (err) {
      setError(err instanceof ConfirmApiError ? err.message : t("confirmPage.errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-4 flex justify-end">
        <LanguageSwitcher />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{t("confirmPage.eyebrow")}</p>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">{t("confirmPage.title")}</h1>

        <div className="mt-4">
          <RequestSummary view={view} />
        </div>

        {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {view.previousInfo && (
          <button
            type="button"
            onClick={handleUsePrevious}
            className="mb-4 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            {t("confirmPage.usePreviousInfo")}
          </button>
        )}

        <form onSubmit={handleConfirm} className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{t("confirmPage.companyShippingHeading")}</p>
            <ShippingAddressFields address={address} onChange={setAddress} />
          </div>

          <label className="text-sm font-medium text-slate-700">
            {t("confirmPage.fullNameLabel")}
            <input
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder={t("confirmPage.fullNamePlaceholder")}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
          </label>

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
            {t("confirmPage.agreeCheckbox")}
          </label>

          <div className="mt-2 flex gap-2">
            {view.requestType !== "PARTS" && (
              <button
                type="button"
                onClick={handleReject}
                disabled={submitting}
                className="flex-1 rounded-md border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {t("confirmPage.reject")}
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="flex-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? t("confirmPage.submitting") : t("confirmPage.confirm")}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function CustomerConfirmationPage({ token }: { token: string }) {
  const { t } = useTranslation();
  usePageTitle(t("confirmPage.title"));
  const [view, setView] = useState<CustomerConfirmationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getConfirmation(token)
      .then((data) => {
        if (!cancelled) setView(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ConfirmApiError ? err.message : t("confirmPage.invalidLink"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">{t("common.loading")}</p>
      </main>
    );
  }

  if (error || !view) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
        <p className="text-sm text-red-600">{error ?? t("confirmPage.invalidLink")}</p>
      </main>
    );
  }

  if (view.status === "PENDING") {
    return <PendingForm token={token} view={view} onDecided={setView} />;
  }

  return <DecidedView view={view} />;
}

export default function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <CustomerConfirmationPage token={decodeURIComponent(token)} />;
}
