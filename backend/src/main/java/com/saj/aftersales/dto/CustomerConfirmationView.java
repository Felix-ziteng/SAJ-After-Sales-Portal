package com.saj.aftersales.dto;

import com.saj.aftersales.entity.RequestTypeCode;

import java.time.Instant;

/**
 * Deliberately narrow — everything a customer is allowed to see and nothing else. No technician
 * name, no manager comments, no other requests, no internal ticket notes.
 */
public record CustomerConfirmationView(
        String requestNumber,
        String zendeskTicketId,
        RequestTypeCode requestType,
        String model,
        String status,
        ShippingAddressDto shippingAddress,
        /** A previous request under the same ticket, if one has already been confirmed — offered
         * as an optional prefill so a repeat customer doesn't retype the same info (no shared
         * customer master data, so this is the only reuse mechanism, and it's ticket-scoped). */
        ShippingAddressDto previousInfo,
        String signatureName,
        String rejectionReason,
        Instant decidedAt
) {
}
