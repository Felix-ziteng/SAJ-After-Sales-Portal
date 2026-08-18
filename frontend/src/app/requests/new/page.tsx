"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { createServiceRequest, listRequestTypes } from "@/lib/api/domain";
import { ItemRows } from "@/components/requests/ItemRows";
import { ShippingAddressFields } from "@/components/requests/ShippingAddressFields";
import { usePageTitle } from "@/lib/hooks/usePageTitle";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { isAddressBlank } from "@/lib/utils/shippingAddress";
import type { CreateServiceRequestRequest, RequestItemInput, RequestType, RequestTypeCode, ShippingAddress } from "@/lib/types/domain";

const EMPTY_ADDRESS: ShippingAddress = {
  line1: "",
  city: "",
  postalCode: "",
  country: "",
  contactName: "",
  contactPhone: "",
};

function TypePicker({ types, selected, onSelect }: { types: RequestType[]; selected: RequestTypeCode | null; onSelect: (t: RequestTypeCode) => void }) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {types.map((type) => (
        <button
          key={type.code}
          type="button"
          onClick={() => onSelect(type.code)}
          className={`rounded-lg border px-4 py-3 text-left transition ${
            selected === type.code ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="text-sm font-medium text-slate-900">{type.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {type.requiresManagerApproval ? t("newRequest.needsManagerApproval") : t("newRequest.noManagerApproval")} ·{" "}
            {type.requiresCustomerConfirmation ? t("newRequest.needsCustomerConfirmation") : t("newRequest.noCustomerConfirmation")}
          </p>
        </button>
      ))}
    </div>
  );
}

function CreateRequestForm() {
  const { t } = useTranslation();
  usePageTitle(t("newRequest.title"));
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketId = searchParams.get("ticketId") ?? "";

  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [selectedType, setSelectedType] = useState<RequestTypeCode | null>(null);
  const [itemCode, setItemCode] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<RequestItemInput[]>([]);
  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    listRequestTypes()
      .then((types) => {
        if (!cancelled) setRequestTypes(types);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType) return;
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const body: CreateServiceRequestRequest = {
        zendeskTicketId: ticketId,
        requestType: selectedType,
        itemCode: selectedType === "REPLACEMENT" ? itemCode || undefined : undefined,
        model: selectedType === "REPLACEMENT" ? model || undefined : undefined,
        serialNumber: serialNumber || undefined,
        reason: reason || undefined,
        items: selectedType === "PARTS" ? items : undefined,
        shippingAddress: isAddressBlank(address) ? undefined : address,
      };
      const created = await createServiceRequest(body);
      router.push(`/requests/${created.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        setError(err.message);
      } else {
        setError(t("newRequest.errorGeneric"));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{t("newRequest.ticketEyebrow", { id: ticketId })}</p>
      <h1 className="mt-1 text-xl font-semibold text-slate-900">{t("newRequest.title")}</h1>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">{t("newRequest.requestTypeHeading")}</h2>
        <TypePicker types={requestTypes} selected={selectedType} onSelect={setSelectedType} />
      </div>

      {selectedType && (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          {selectedType === "REPLACEMENT" && (
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">{t("newRequest.replacementDetailsHeading")}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  {t("newRequest.itemCodeLabel")}
                  <input
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  {t("newRequest.modelLabel")}
                  <input
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                  />
                  {fieldErrors.model && <p className="mt-1 text-xs text-red-600">{fieldErrors.model}</p>}
                </label>
              </div>
              <label className="text-sm font-medium text-slate-700">
                {t("newRequest.serialNumberLabel")}
                <input
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                {t("newRequest.faultReasonLabel")}
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
            </div>
          )}

          {selectedType === "PARTS" && (
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">{t("newRequest.partsHeading")}</h3>
              <ItemRows items={items} onChange={setItems} />
              <label className="text-sm font-medium text-slate-700">
                {t("newRequest.reasonLabel")}
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t("newRequest.shippingAddressHeading")}</h3>
              <p className="mt-0.5 text-xs text-slate-400">
                {selectedType === "PARTS" ? t("newRequest.shippingAddressHintParts") : t("newRequest.shippingAddressHint")}
              </p>
            </div>
            <ShippingAddressFields address={address} onChange={setAddress} />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? t("common.creating") : t("newRequest.createButton")}
          </button>
        </form>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CreateRequestForm />
    </Suspense>
  );
}
