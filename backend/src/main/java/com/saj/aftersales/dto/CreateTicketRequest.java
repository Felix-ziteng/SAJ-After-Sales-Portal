package com.saj.aftersales.dto;

import jakarta.validation.constraints.NotBlank;

/** {@code zendeskTicketId} is typed in by the technician — see D-note in ZendeskTicket entity. */
public record CreateTicketRequest(
        @NotBlank String zendeskTicketId,
        String subject,
        String requesterEmail
) {
}
