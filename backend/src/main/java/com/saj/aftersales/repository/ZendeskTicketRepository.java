package com.saj.aftersales.repository;

import com.saj.aftersales.entity.ZendeskTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ZendeskTicketRepository extends JpaRepository<ZendeskTicket, Long> {

    Optional<ZendeskTicket> findByZendeskTicketId(String zendeskTicketId);

    boolean existsByZendeskTicketId(String zendeskTicketId);
}
