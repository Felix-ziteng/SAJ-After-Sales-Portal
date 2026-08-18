package com.saj.aftersales.dto;

import com.saj.aftersales.entity.RequestTypeCode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * {@code model} is required for {@code REPLACEMENT} and ignored for {@code PARTS} — checked in
 * {@code ServiceRequestService}, not here, since it depends on {@code requestType}. {@code
 * itemCode} is always optional.
 */
public record CreateServiceRequestRequest(
        @NotBlank String zendeskTicketId,
        @NotNull RequestTypeCode requestType,
        String itemCode,
        String model,
        String serialNumber,
        String reason,
        List<@Valid RequestItemInput> items,
        @Valid ShippingAddressDto shippingAddress
) {
}
