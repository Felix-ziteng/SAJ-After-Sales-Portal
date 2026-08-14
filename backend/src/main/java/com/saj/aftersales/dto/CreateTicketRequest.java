package com.saj.aftersales.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** {@code zendeskTicketId} is typed in by the technician — see D-note in ZendeskTicket entity. */
public record CreateTicketRequest(
        @NotBlank String zendeskTicketId,
        @NotNull Long customerId,
        String subject,
        String requesterEmail
) {
}
