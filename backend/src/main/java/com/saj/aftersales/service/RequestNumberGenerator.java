package com.saj.aftersales.service;

import com.saj.aftersales.entity.RequestNumberSequence;
import com.saj.aftersales.repository.RequestNumberSequenceRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;

/**
 * Issues request numbers like {@code REQ-2026-0001}. Row-locks the current year's counter so
 * concurrent creations can't collide — cheap at this volume (~200 requests/month) and simpler
 * than a database-specific atomic-upsert trick.
 */
@Component
public class RequestNumberGenerator {

    private final RequestNumberSequenceRepository sequenceRepository;

    public RequestNumberGenerator(RequestNumberSequenceRepository sequenceRepository) {
        this.sequenceRepository = sequenceRepository;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public String next() {
        int year = Year.now().getValue();
        RequestNumberSequence sequence = sequenceRepository.lockByYear(year)
                .orElseGet(() -> {
                    RequestNumberSequence created = new RequestNumberSequence();
                    created.setYear(year);
                    created.setLastValue(0);
                    return created;
                });
        sequence.setLastValue(sequence.getLastValue() + 1);
        sequenceRepository.save(sequence);
        return "REQ-%d-%04d".formatted(year, sequence.getLastValue());
    }
}
