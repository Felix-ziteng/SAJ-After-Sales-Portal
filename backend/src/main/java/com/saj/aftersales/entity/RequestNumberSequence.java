package com.saj.aftersales.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "request_number_sequences")
@Getter
@Setter
@NoArgsConstructor
public class RequestNumberSequence {

    @Id
    @Column(name = "seq_year")
    private Integer year;

    @Column(name = "last_number", nullable = false)
    private int lastValue;
}
