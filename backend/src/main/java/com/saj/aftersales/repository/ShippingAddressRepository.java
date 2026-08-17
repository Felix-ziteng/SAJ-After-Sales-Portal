package com.saj.aftersales.repository;

import com.saj.aftersales.entity.ShippingAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShippingAddressRepository extends JpaRepository<ShippingAddress, Long> {

    Optional<ShippingAddress> findByServiceRequest_Id(Long serviceRequestId);

    /** For the confirm page's "use previous info" prefill (no shared customer master data — see
     * memory — so reuse is scoped to other requests under the same ticket only). */
    List<ShippingAddress> findByServiceRequest_ZendeskTicket_IdOrderByServiceRequest_CreatedAtDesc(Long zendeskTicketId);
}
