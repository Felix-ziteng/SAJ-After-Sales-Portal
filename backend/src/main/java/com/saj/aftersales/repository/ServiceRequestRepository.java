package com.saj.aftersales.repository;

import com.saj.aftersales.entity.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    List<ServiceRequest> findByZendeskTicket_ZendeskTicketIdOrderByCreatedAtDesc(String zendeskTicketId);

    List<ServiceRequest> findAllByOrderByCreatedAtDesc();
}
