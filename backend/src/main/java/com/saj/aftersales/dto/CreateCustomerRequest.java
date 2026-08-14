package com.saj.aftersales.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCustomerRequest(
        @NotBlank String name,
        String vatNumber,
        String country,
        String zendeskOrgId
) {
}
