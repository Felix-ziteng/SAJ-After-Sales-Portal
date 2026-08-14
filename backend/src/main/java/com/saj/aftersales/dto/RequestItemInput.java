package com.saj.aftersales.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RequestItemInput(
        @NotNull Long catalogItemId,
        @Min(1) int quantity,
        String notes
) {
}
