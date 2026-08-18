package com.saj.aftersales.mapper;

import com.saj.aftersales.dto.CustomerConfirmationView;
import com.saj.aftersales.dto.ShippingAddressDto;
import com.saj.aftersales.entity.CustomerConfirmation;
import com.saj.aftersales.entity.ServiceRequest;
import com.saj.aftersales.entity.ShippingAddress;
import org.springframework.stereotype.Component;

@Component
public class CustomerConfirmationMapper {

    public CustomerConfirmationView toView(CustomerConfirmation confirmation, ShippingAddress address, ShippingAddress previous) {
        ServiceRequest sr = confirmation.getServiceRequest();
        return new CustomerConfirmationView(
                sr.getRequestNumber(),
                sr.getZendeskTicket().getZendeskTicketId(),
                sr.getRequestType().getCode(),
                sr.getModel(),
                confirmation.getStatus().name(),
                address != null ? toAddressDto(address) : null,
                previous != null ? toAddressDto(previous) : null,
                confirmation.getSignatureName(),
                confirmation.getRejectionReason(),
                confirmation.getDecidedAt());
    }

    private ShippingAddressDto toAddressDto(ShippingAddress address) {
        return new ShippingAddressDto(
                address.getLine1(), address.getLine2(), address.getCity(),
                address.getPostalCode(), address.getCountry(),
                address.getContactName(), address.getContactPhone(),
                address.getCompanyName(), address.getVatNumber());
    }
}
