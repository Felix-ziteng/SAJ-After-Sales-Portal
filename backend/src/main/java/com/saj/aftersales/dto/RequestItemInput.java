package com.saj.aftersales.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record RequestItemInput(
        String itemCode,
        @NotBlank String name,
        @Min(1) int quantity,
        String notes
) {
}
