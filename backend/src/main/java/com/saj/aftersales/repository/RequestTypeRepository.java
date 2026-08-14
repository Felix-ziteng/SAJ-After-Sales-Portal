package com.saj.aftersales.repository;

import com.saj.aftersales.entity.RequestType;
import com.saj.aftersales.entity.RequestTypeCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RequestTypeRepository extends JpaRepository<RequestType, Long> {

    Optional<RequestType> findByCode(RequestTypeCode code);
}
