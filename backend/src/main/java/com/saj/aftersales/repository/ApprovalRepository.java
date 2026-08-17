package com.saj.aftersales.repository;

import com.saj.aftersales.entity.Approval;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalRepository extends JpaRepository<Approval, Long> {

    /** Guards user deletion — see {@code ServiceRequestRepository.existsByTechnician_Id}. */
    boolean existsByManager_Id(Long managerId);
}
