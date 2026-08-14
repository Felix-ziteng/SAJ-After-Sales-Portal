package com.saj.aftersales.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * A local reference to a Zendesk case — not a synced copy. Until Phase 11 wires up the real
 * Zendesk API, the technician types {@link #zendeskTicketId} in by hand, so it's just an
 * arbitrary unique string, not something validated against Zendesk.
 */
@Entity
@Table(name = "zendesk_tickets")
@Getter
@Setter
@NoArgsConstructor
public class ZendeskTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String zendeskTicketId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    private String subject;

    private String requesterEmail;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
