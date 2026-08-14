package com.saj.aftersales.mapper;

import com.saj.aftersales.dto.RequestItemDto;
import com.saj.aftersales.dto.ServiceRequestDto;
import com.saj.aftersales.dto.ShippingAddressDto;
import com.saj.aftersales.entity.RequestItem;
import com.saj.aftersales.entity.ServiceRequest;
import com.saj.aftersales.entity.ShippingAddress;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ServiceRequestMapper {

    public ServiceRequestDto toDto(ServiceRequest sr, List<RequestItem> items, ShippingAddress address) {
        return new ServiceRequestDto(
                sr.getId(),
                sr.getRequestNumber(),
                sr.getZendeskTicket().getZendeskTicketId(),
                sr.getRequestType().getCode(),
                sr.getCustomer().getId(),
                sr.getCustomer().getName(),
                sr.getTechnician().getId(),
                sr.getTechnician().getDisplayName(),
                sr.getProduct() != null ? sr.getProduct().getId() : null,
                sr.getProduct() != null ? sr.getProduct().getName() : null,
                sr.getSerialNumber(),
                sr.getReason(),
                sr.getStatus(),
                items.stream().map(this::toItemDto).toList(),
                address != null ? toAddressDto(address) : null,
                sr.getCreatedAt(),
                sr.getUpdatedAt(),
                sr.getSubmittedAt(),
                sr.getCompletedAt());
    }

    private RequestItemDto toItemDto(RequestItem item) {
        return new RequestItemDto(
                item.getId(),
                item.getCatalogItem().getId(),
                item.getCatalogItem().getSku(),
                item.getCatalogItem().getName(),
                item.getQuantity(),
                item.getNotes());
    }

    private ShippingAddressDto toAddressDto(ShippingAddress address) {
        return new ShippingAddressDto(
                address.getLine1(), address.getLine2(), address.getCity(),
                address.getPostalCode(), address.getCountry(),
                address.getContactName(), address.getContactPhone());
    }
}
