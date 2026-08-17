package com.saj.aftersales.dto;

import com.saj.aftersales.entity.RequestStatus;

import java.time.Instant;

public record AuditLogDto(
        Long id,
        String actorName,
        String actorRole,
        String actorType,
        String action,
        RequestStatus previousStatus,
        RequestStatus newStatus,
        String comment,
        Instant createdAt
) {
}
