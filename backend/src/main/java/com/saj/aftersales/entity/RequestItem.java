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

@Entity
@Table(name = "request_items")
@Getter
@Setter
@NoArgsConstructor
public class RequestItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_request_id", nullable = false)
    private ServiceRequest serviceRequest;

    /** Typed by the Technician rather than picked from a shared catalog. {@code itemCode} is
     * optional; {@code name} is required (enforced via bean validation on the input DTO, since
     * every parts line item unconditionally needs one). */
    private String itemCode;
    private String name;

    @Column(nullable = false)
    private int quantity;

    private String notes;
}
