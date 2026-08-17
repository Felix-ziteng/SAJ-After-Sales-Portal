package com.saj.aftersales.dto;

import jakarta.validation.constraints.NotBlank;

public record ShippingAddressDto(
        @NotBlank String line1,
        String line2,
        @NotBlank String city,
        @NotBlank String postalCode,
        @NotBlank String country,
        @NotBlank String contactName,
        @NotBlank String contactPhone,
        String companyName,
        String vatNumber
) {
}
