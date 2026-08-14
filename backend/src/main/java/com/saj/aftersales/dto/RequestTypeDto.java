package com.saj.aftersales.dto;

import com.saj.aftersales.entity.RequestTypeCode;

public record RequestTypeDto(
        Long id,
        RequestTypeCode code,
        String name,
        boolean requiresManagerApproval,
        boolean requiresCustomerConfirmation
) {
}
