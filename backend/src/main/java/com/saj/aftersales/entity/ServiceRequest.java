package com.saj.aftersales.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "service_requests")
@Getter
@Setter
@NoArgsConstructor
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** e.g. REQ-2026-0001 — assigned once, at creation, by RequestNumberGenerator. */
    @Column(nullable = false, unique = true)
    private String requestNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zendesk_ticket_id", nullable = false)
    private ZendeskTicket zendeskTicket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_type_id", nullable = false)
    private RequestType requestType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id", nullable = false)
    private UserEntity technician;

    /** The replacement product for a Replacement request; unused by Parts. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private CatalogItem product;

    /** Set only when this request was opened as a reopen of a completed one (D15). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reopened_from_request_id")
    private ServiceRequest reopenedFrom;

    private String serialNumber;

    @Column(columnDefinition = "TEXT")
    private String reason;

    /** Reserved (D10) — not read or written by any v1 UI or API response yet. */
    private String priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private RequestStatus status = RequestStatus.DRAFT;

    /** The status to restore on resume — set only while {@link #status} is {@code ON_HOLD}. */
    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private RequestStatus heldFromStatus;

    /** Set only while {@link #status} is {@code REJECTED} — decides what "Revise" does (D4). */
    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private RejectionSource rejectionSource;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    private Instant submittedAt;

    private Instant completedAt;
}
