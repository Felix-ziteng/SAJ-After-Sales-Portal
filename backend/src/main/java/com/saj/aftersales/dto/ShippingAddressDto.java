package com.saj.aftersales.dto;

/**
 * Every field is optional here — a Technician can create/edit a request without knowing the
 * shipping details yet (the customer fills them in when confirming). Completeness is enforced
 * client-side on the confirm page, not by bean validation, since "required" only applies to that
 * one flow.
 */
public record ShippingAddressDto(
        String line1,
        String line2,
        String city,
        String postalCode,
        String country,
        String contactName,
        String contactPhone,
        String companyName,
        String vatNumber
) {
}
