import { useTranslation } from "@/lib/i18n/LocaleProvider";
import type { ShippingAddress } from "@/lib/types/domain";

export function ShippingAddressFields({
  address,
  onChange,
}: {
  address: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder={t("shippingAddress.companyName")}
          value={address.companyName ?? ""}
          onChange={(e) => onChange({ ...address, companyName: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <input
          placeholder={t("shippingAddress.vatNumber")}
          value={address.vatNumber ?? ""}
          onChange={(e) => onChange({ ...address, vatNumber: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>
      <input
        placeholder={t("shippingAddress.addressLine1")}
        value={address.line1}
        onChange={(e) => onChange({ ...address, line1: e.target.value })}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder={t("shippingAddress.city")}
          value={address.city}
          onChange={(e) => onChange({ ...address, city: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <input
          placeholder={t("shippingAddress.postalCode")}
          value={address.postalCode}
          onChange={(e) => onChange({ ...address, postalCode: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>
      <input
        placeholder={t("shippingAddress.country")}
        value={address.country}
        onChange={(e) => onChange({ ...address, country: e.target.value })}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder={t("shippingAddress.contactName")}
          value={address.contactName}
          onChange={(e) => onChange({ ...address, contactName: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <input
          placeholder={t("shippingAddress.contactPhone")}
          value={address.contactPhone}
          onChange={(e) => onChange({ ...address, contactPhone: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>
    </div>
  );
}
