package com.saj.aftersales.mapper;

import com.saj.aftersales.dto.RequestItemDto;
import com.saj.aftersales.dto.ServiceRequestDto;
import com.saj.aftersales.dto.ShippingAddressDto;
import com.saj.aftersales.entity.CustomerConfirmation;
import com.saj.aftersales.entity.RequestItem;
import com.saj.aftersales.entity.ServiceRequest;
import com.saj.aftersales.entity.ShippingAddress;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ServiceRequestMapper {

    public ServiceRequestDto toDto(ServiceRequest sr, List<RequestItem> items, ShippingAddress address,
                                    CustomerConfirmation confirmation) {
        return new ServiceRequestDto(
                sr.getId(),
                sr.getRequestNumber(),
                sr.getZendeskTicket().getZendeskTicketId(),
                sr.getRequestType().getCode(),
                sr.getTechnician().getId(),
                sr.getTechnician().getDisplayName(),
                sr.getItemCode(),
                sr.getModel(),
                sr.getSerialNumber(),
                sr.getReason(),
                sr.getStatus(),
                sr.getHeldFromStatus(),
                sr.getRejectionSource(),
                items.stream().map(this::toItemDto).toList(),
                address != null ? toAddressDto(address) : null,
                confirmation != null ? confirmation.getToken() : null,
                confirmation != null ? confirmation.getStatus().name() : null,
                sr.getCreatedAt(),
                sr.getUpdatedAt(),
                sr.getSubmittedAt(),
                sr.getCompletedAt());
    }

    private RequestItemDto toItemDto(RequestItem item) {
        return new RequestItemDto(
                item.getId(),
                item.getItemCode(),
                item.getName(),
                item.getQuantity(),
                item.getNotes());
    }

    private ShippingAddressDto toAddressDto(ShippingAddress address) {
        return new ShippingAddressDto(
                address.getLine1(), address.getLine2(), address.getCity(),
                address.getPostalCode(), address.getCountry(),
                address.getContactName(), address.getContactPhone(),
                address.getCompanyName(), address.getVatNumber());
    }
}
