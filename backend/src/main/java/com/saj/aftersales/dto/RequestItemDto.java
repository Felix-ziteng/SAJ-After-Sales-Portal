package com.saj.aftersales.dto;

public record RequestItemDto(
        Long id,
        Long catalogItemId,
        String sku,
        String name,
        int quantity,
        String notes
) {
}
