package com.saj.aftersales.dto;

import jakarta.validation.Valid;

import java.util.List;

/** Partial update, DRAFT-only (enforced in the service) — every field optional. */
public record UpdateServiceRequestRequest(
        Long productId,
        String serialNumber,
        String reason,
        List<@Valid RequestItemInput> items,
        @Valid ShippingAddressDto shippingAddress
) {
}
