import type { RequestTypeCode, ShippingAddress } from "@/lib/types/domain";

export type ConfirmationStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export interface CustomerConfirmationView {
  requestNumber: string;
  zendeskTicketId: string;
  requestType: RequestTypeCode;
  productName: string | null;
  status: ConfirmationStatus;
  shippingAddress: ShippingAddress | null;
  /** A previous request under the same ticket already confirmed once, if any — offered as an
   * optional prefill (no shared customer master data, so this is the only reuse mechanism). */
  previousInfo: ShippingAddress | null;
  signatureName: string | null;
  rejectionReason: string | null;
  decidedAt: string | null;
}

export interface ConfirmActionRequest {
  signatureName: string;
  shippingAddress: ShippingAddress;
}
