package com.saj.aftersales.dto;

import com.saj.aftersales.entity.RejectionSource;
import com.saj.aftersales.entity.RequestStatus;
import com.saj.aftersales.entity.RequestTypeCode;

import java.time.Instant;
import java.util.List;

public record ServiceRequestDto(
        Long id,
        String requestNumber,
        String zendeskTicketId,
        RequestTypeCode requestType,
        Long technicianId,
        String technicianName,
        Long productId,
        String productName,
        String serialNumber,
        String reason,
        RequestStatus status,
        RequestStatus heldFromStatus,
        RejectionSource rejectionSource,
        List<RequestItemDto> items,
        ShippingAddressDto shippingAddress,
        /** {@code /confirm/{token}} path, staff-visible whenever a confirmation record exists —
         * see the plaintext-token decision in CustomerConfirmation. Null until one is created. */
        String confirmationToken,
        String confirmationStatus,
        Instant createdAt,
        Instant updatedAt,
        Instant submittedAt,
        Instant completedAt
) {
}
