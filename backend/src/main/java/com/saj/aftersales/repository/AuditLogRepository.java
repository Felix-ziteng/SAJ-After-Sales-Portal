package com.saj.aftersales.repository;

import com.saj.aftersales.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByServiceRequest_IdOrderByCreatedAtAsc(Long serviceRequestId);

    /** Guards user deletion — see {@code ServiceRequestRepository.existsByTechnician_Id}. */
    boolean existsByActorUser_Id(Long actorUserId);
}
