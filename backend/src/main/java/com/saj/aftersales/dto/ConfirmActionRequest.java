package com.saj.aftersales.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ConfirmActionRequest(
        @NotBlank String signatureName,
        @NotNull @Valid ShippingAddressDto shippingAddress
) {
}
