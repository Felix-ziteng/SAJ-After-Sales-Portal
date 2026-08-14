package com.saj.aftersales.dto;

import com.saj.aftersales.entity.CatalogCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCatalogItemRequest(
        @NotBlank String sku,
        @NotBlank String name,
        @NotNull CatalogCategory category
) {
}
