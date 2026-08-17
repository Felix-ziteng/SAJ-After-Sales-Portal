package com.saj.aftersales.repository;

import com.saj.aftersales.entity.CustomerConfirmation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerConfirmationRepository extends JpaRepository<CustomerConfirmation, Long> {

    Optional<CustomerConfirmation> findByToken(String token);

    Optional<CustomerConfirmation> findByServiceRequest_Id(Long serviceRequestId);
}
