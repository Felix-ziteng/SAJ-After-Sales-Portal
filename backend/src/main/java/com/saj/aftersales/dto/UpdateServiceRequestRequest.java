package com.saj.aftersales.dto;

import jakarta.validation.Valid;

import java.util.List;

/** Partial update, DRAFT-only (enforced in the service) — every field optional. */
public record UpdateServiceRequestRequest(
        String itemCode,
        String model,
        String serialNumber,
        String reason,
        List<@Valid RequestItemInput> items,
        @Valid ShippingAddressDto shippingAddress
) {
}
