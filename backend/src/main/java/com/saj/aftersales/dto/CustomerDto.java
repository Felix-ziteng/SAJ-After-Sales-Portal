package com.saj.aftersales.dto;

public record CustomerDto(
        Long id,
        String name,
        String vatNumber,
        String country,
        String zendeskOrgId
) {
}
