package com.saj.aftersales.service;

import com.saj.aftersales.dto.ShippingAddressDto;
import com.saj.aftersales.entity.ServiceRequest;
import com.saj.aftersales.entity.ShippingAddress;
import com.saj.aftersales.repository.ShippingAddressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Shared by {@link ServiceRequestService} (Technician/Admin edits) and
 * {@link CustomerConfirmationService} (the customer filling it in themselves, per D1/memory). */
@Service
public class ShippingAddressService {

    private final ShippingAddressRepository shippingAddressRepository;

    public ShippingAddressService(ShippingAddressRepository shippingAddressRepository) {
        this.shippingAddressRepository = shippingAddressRepository;
    }

    @Transactional
    public void upsert(ServiceRequest sr, ShippingAddressDto dto) {
        if (dto == null) {
            return;
        }
        ShippingAddress address = shippingAddressRepository.findByServiceRequest_Id(sr.getId())
                .orElseGet(() -> {
                    ShippingAddress created = new ShippingAddress();
                    created.setServiceRequest(sr);
                    return created;
                });
        address.setLine1(dto.line1());
        address.setLine2(dto.line2());
        address.setCity(dto.city());
        address.setPostalCode(dto.postalCode());
        address.setCountry(dto.country());
        address.setContactName(dto.contactName());
        address.setContactPhone(dto.contactPhone());
        address.setCompanyName(dto.companyName());
        address.setVatNumber(dto.vatNumber());
        shippingAddressRepository.save(address);
    }
}
