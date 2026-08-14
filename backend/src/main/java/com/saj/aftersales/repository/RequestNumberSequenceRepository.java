package com.saj.aftersales.repository;

import com.saj.aftersales.entity.RequestNumberSequence;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RequestNumberSequenceRepository extends JpaRepository<RequestNumberSequence, Integer> {

    /** Row-locked so concurrent request creation in the same year can't hand out duplicate numbers. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from RequestNumberSequence s where s.year = :year")
    Optional<RequestNumberSequence> lockByYear(@Param("year") int year);
}
