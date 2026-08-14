package com.saj.aftersales.repository;

import com.saj.aftersales.entity.ShippingAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShippingAddressRepository extends JpaRepository<ShippingAddress, Long> {

    Optional<ShippingAddress> findByServiceRequest_Id(Long serviceRequestId);
}
