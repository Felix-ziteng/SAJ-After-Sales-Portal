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

import java.time.Instant;

/** Append-only. No repository method here ever updates or deletes a row — see the migration
 * comment for why that isn't also enforced at the DB-grant level yet. */
@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_request_id", nullable = false)
    private ServiceRequest serviceRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id")
    private UserEntity actorUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ActorType actorType;

    private String actorRole;

    @Column(nullable = false, length = 32)
    private String action;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private RequestStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private RequestStatus newStatus;

    @Column(columnDefinition = "TEXT")
    private String comment;

    private String ipAddress;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
