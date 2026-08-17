package com.saj.aftersales.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectRequestBody(@NotBlank String reason) {
}
