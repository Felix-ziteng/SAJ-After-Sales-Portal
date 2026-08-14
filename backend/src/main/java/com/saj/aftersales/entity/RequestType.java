package com.saj.aftersales.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "request_types")
@Getter
@Setter
@NoArgsConstructor
public class RequestType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 32)
    private RequestTypeCode code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private boolean requiresManagerApproval;

    @Column(nullable = false)
    private boolean requiresCustomerConfirmation;
}
