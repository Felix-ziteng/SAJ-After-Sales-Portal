package com.saj.aftersales.dto;

import com.saj.aftersales.entity.CatalogCategory;

public record CatalogItemDto(
        Long id,
        String sku,
        String name,
        CatalogCategory category,
        boolean active
) {
}
