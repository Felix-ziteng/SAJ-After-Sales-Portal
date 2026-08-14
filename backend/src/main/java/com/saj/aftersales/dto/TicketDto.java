package com.saj.aftersales.dto;

import java.time.Instant;

public record TicketDto(
        Long id,
        String zendeskTicketId,
        Long customerId,
        String customerName,
        String subject,
        String requesterEmail,
        Instant createdAt
) {
}
