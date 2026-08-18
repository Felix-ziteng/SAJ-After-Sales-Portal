import type { ShippingAddress } from "@/lib/types/domain";

/** True if every field is empty — used to decide whether to omit `shippingAddress` from a
 * create/update payload entirely, rather than sending an empty-but-present object, so a request
 * stays in the same "no address yet" state the rest of the app (PDF export, detail page) expects
 * until someone actually fills something in. */
export function isAddressBlank(address: ShippingAddress): boolean {
  return !(
    address.line1 ||
    address.city ||
    address.postalCode ||
    address.country ||
    address.contactName ||
    address.contactPhone ||
    address.companyName ||
    address.vatNumber
  );
}
