package com.saj.aftersales.dto;

import com.saj.aftersales.entity.RequestStatus;
import com.saj.aftersales.entity.RequestTypeCode;

import java.time.Instant;
import java.util.List;

public record ServiceRequestDto(
        Long id,
        String requestNumber,
        String zendeskTicketId,
        RequestTypeCode requestType,
        Long customerId,
        String customerName,
        Long technicianId,
        String technicianName,
        Long productId,
        String productName,
        String serialNumber,
        String reason,
        RequestStatus status,
        List<RequestItemDto> items,
        ShippingAddressDto shippingAddress,
        Instant createdAt,
        Instant updatedAt,
        Instant submittedAt,
        Instant completedAt
) {
}
