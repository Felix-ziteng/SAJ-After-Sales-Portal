package com.saj.aftersales.dto;

public record RequestItemDto(
        Long id,
        String itemCode,
        String name,
        int quantity,
        String notes
) {
}
